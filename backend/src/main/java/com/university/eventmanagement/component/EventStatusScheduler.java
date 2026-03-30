package com.university.eventmanagement.component;

import com.university.eventmanagement.model.Event;
import com.university.eventmanagement.model.EventStatus;
import com.university.eventmanagement.model.RoleAssignmentStatus;
import com.university.eventmanagement.model.UserRole;
import com.university.eventmanagement.model.Registration;
import com.university.eventmanagement.model.RegistrationStatus;
import com.university.eventmanagement.repository.AttendanceLogRepository;
import com.university.eventmanagement.repository.EventRepository;
import com.university.eventmanagement.repository.RegistrationRepository;
import com.university.eventmanagement.repository.UserRoleRepository;
import com.university.eventmanagement.service.StudentEngagementService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Objects;

@Component
public class EventStatusScheduler {

    private static final Logger log = LoggerFactory.getLogger(EventStatusScheduler.class);

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private RegistrationRepository registrationRepository;

    @Autowired
    private AttendanceLogRepository attendanceLogRepository;

    @Autowired
    private StudentEngagementService engagementService;

    @Autowired(required = false)
    private CacheManager cacheManager;

    @Scheduled(fixedRate = 60000) // Run every minute
    @Transactional
    public void markEventsAsCompleted() {
        LocalDateTime now = LocalDateTime.now();

        List<Event> activeEvents = eventRepository.findAll().stream()
                .filter(e -> e.getStatus() == EventStatus.CREATED
                        || e.getStatus() == EventStatus.REGISTRATION_OPEN
                        || e.getStatus() == EventStatus.REGISTRATION_CLOSED
                        || e.getStatus() == EventStatus.ATTENDANCE_ACTIVE
                        || e.getStatus() == EventStatus.ATTENDANCE_PAUSED)
                .toList();

        for (Event event : activeEvents) {
            // Use endDate if available (for multi-day / cross-midnight events), else fall
            // back to eventDate
            java.time.LocalDate effectiveEndDate = event.getEndDate() != null ? event.getEndDate()
                    : event.getEventDate();
            LocalDateTime endDateTime;
            if (event.getEndTime() != null) {
                endDateTime = LocalDateTime.of(effectiveEndDate, event.getEndTime());
            } else {
                endDateTime = LocalDateTime.of(effectiveEndDate, LocalTime.MAX);
            }

            if (now.isAfter(endDateTime)) {
                log.info("Auto-closing event '{}' (id={}) — end time {} has passed",
                        event.getTitle(), event.getId(), endDateTime);
                event.setStatus(EventStatus.ATTENDANCE_CLOSED);
                eventRepository.save(event);
                processNoShows(event);
            } else if (event.getStatus() == EventStatus.CREATED
                    || event.getStatus() == EventStatus.REGISTRATION_OPEN
                    || event.getStatus() == EventStatus.REGISTRATION_CLOSED) {
                LocalDateTime startDateTime = LocalDateTime.of(event.getEventDate(),
                        event.getStartTime() != null ? event.getStartTime() : LocalTime.MIN);
                if (now.isAfter(startDateTime) && now.isBefore(endDateTime)) {
                    log.info("Auto-activating event '{}' (id={}) — start time {} reached",
                            event.getTitle(), event.getId(), startDateTime);
                    event.setStatus(EventStatus.ATTENDANCE_ACTIVE);
                    eventRepository.save(event);
                }
            }
        }
    }

    private void processNoShows(Event event) {
        List<Registration> confirmedRegs = registrationRepository.findByEvent(event).stream()
                .filter(r -> r.getStatus() == RegistrationStatus.CONFIRMED)
                .toList();

        for (Registration reg : confirmedRegs) {
            if (!attendanceLogRepository.existsByEventAndUser(event, reg.getUser())) {
                engagementService.recordNoShow(reg.getUser());
            }
        }
        log.info("Processed no-shows for event: {}", event.getId());
    }

    /**
     * Expire role assignments that have passed their validUntil date.
     * Runs every hour. Evicts permission caches for affected users.
     */
    @Scheduled(fixedRate = 3600000) // Run every hour
    @Transactional
    public void expireRoleAssignments() {
        LocalDateTime now = LocalDateTime.now();

        List<UserRole> expiredRoles = userRoleRepository.findByStatusAndValidUntilBefore(
                RoleAssignmentStatus.ACTIVE, now);

        if (expiredRoles.isEmpty())
            return;

        for (UserRole ur : expiredRoles) {
            ur.setStatus(RoleAssignmentStatus.EXPIRED);
            userRoleRepository.save(ur);

            log.info("Role expired: user={}, role={}, scope={}, validUntil={}",
                    ur.getUser().getId(),
                    ur.getRole().getName(),
                    ur.getClub() != null ? ur.getClub().getName()
                            : (ur.getDepartment() != null ? ur.getDepartment().getName() : "global"),
                    ur.getValidUntil());

            // Evict permission caches for the affected user
            evictPermissionCache(ur.getUser().getId());
        }

        // Also expire PENDING invitations that have passed their validUntil
        List<UserRole> expiredPending = userRoleRepository.findByStatusAndValidUntilBefore(
                RoleAssignmentStatus.PENDING, now);

        for (UserRole ur : expiredPending) {
            ur.setStatus(RoleAssignmentStatus.EXPIRED);
            userRoleRepository.save(ur);

            log.info("Pending invitation expired: user={}, role={}, validUntil={}",
                    ur.getUser().getId(),
                    ur.getRole().getName(),
                    ur.getValidUntil());
        }

        log.info("Role expiry check complete. Expired {} active roles, {} pending invitations.",
                expiredRoles.size(), expiredPending.size());
    }

    private void evictPermissionCache(Long userId) {
        if (cacheManager != null) {
            var permCache = cacheManager.getCache("userPermissions");
            var listCache = cacheManager.getCache("userPermissionsList");
            if (permCache != null)
                permCache.evict(Objects.requireNonNull(userId));
            if (listCache != null)
                listCache.evict(Objects.requireNonNull(userId));
        }
    }
}
