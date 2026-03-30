package com.university.eventmanagement.service;

import com.university.eventmanagement.model.*;
import com.university.eventmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Handles scheduled no-show tracking, engagement score recalculation,
 * and certificate auto-generation after events complete.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReminderSchedulerService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final AttendanceLogRepository attendanceLogRepository;
    private final StudentEngagementService engagementService;
    private final CertificateService certificateService;
    private final NotificationService notificationService;

    /**
     * Runs every hour. For events that ended in the last 2 hours,
     * marks no-shows and generates certificates for attendees.
     */
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void processCompletedEvents() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime twoHoursAgo = now.minusHours(2);

        List<Event> recentlyCompleted = eventRepository.findAll().stream()
                .filter(e -> e.getStatus() == EventStatus.ATTENDANCE_CLOSED)
                .filter(e -> {
                    if (e.getEventDate() == null)
                        return false;
                    LocalTime endTime = e.getEndTime() != null ? e.getEndTime() : LocalTime.of(23, 59);
                    LocalDate endDate = e.getEndDate() != null ? e.getEndDate() : e.getEventDate();
                    LocalDateTime eventEnd = LocalDateTime.of(endDate, endTime);
                    return eventEnd.isAfter(twoHoursAgo) && eventEnd.isBefore(now.plusMinutes(5));
                })
                .toList();

        for (Event event : recentlyCompleted) {
            processEventNoShowsAndCertificates(event);
        }
    }

    @Transactional
    public void processEventNoShowsAndCertificates(Event event) {
        List<Registration> confirmedRegs = registrationRepository.findByEvent(event).stream()
                .filter(r -> r.getStatus() == RegistrationStatus.CONFIRMED)
                .toList();

        int noShows = 0;
        int certIssued = 0;

        for (Registration reg : confirmedRegs) {
            User user = reg.getUser();
            boolean attended = attendanceLogRepository.existsByEventAndUser(event, user);

            if (attended) {
                // Issue certificate if not already issued
                boolean certExists = certificateService.existsCertificate(user, event);
                if (!certExists) {
                    try {
                        certificateService.generateCertificate(user, event);
                        notificationService.sendCertificateIssuedNotification(user, event);
                        certIssued++;
                    } catch (Exception e) {
                        log.error("Failed to generate certificate for user {} event {}",
                                user.getId(), event.getId(), e);
                    }
                }
            } else {
                // Mark as no-show
                engagementService.recordNoShow(user);
                noShows++;
            }
        }

        log.info("Event '{}' processed: {} no-shows, {} certificates issued",
                event.getTitle(), noShows, certIssued);
    }
}
