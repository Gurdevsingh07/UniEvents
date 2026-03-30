package com.university.eventmanagement.service;

import com.university.eventmanagement.aspect.LogAudit;
import com.university.eventmanagement.dto.RegistrationResponse;
import com.university.eventmanagement.exception.*;
import com.university.eventmanagement.model.*;
import com.university.eventmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final AttendanceLogRepository attendanceLogRepository;
    private final AuthService authService;
    private final StudentEngagementService engagementService;
    private final NotificationService notificationService;

    @LogAudit(action = "REGISTER_EVENT", entityType = "Registration", entityIdExpression = "#result.id")
    public RegistrationResponse registerForEvent(Long eventId) {
        User currentUser = authService.getCurrentUser();
        Event event = eventRepository.findById(Objects.requireNonNull(eventId))
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        if (registrationRepository.existsByEventAndUser(event, currentUser)) {
            throw new DuplicateResourceException("You are already registered for this event");
        }

        if (event.getStatus() == EventStatus.ATTENDANCE_CLOSED || event.getStatus() == EventStatus.CANCELLED) {
            throw new BadRequestException("Cannot register for an event that is completed or cancelled");
        }

        // Time-based check: Close registration if event has ended (or started if no end
        // time)
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDate effectiveEndDate = event.getEndDate() != null ? event.getEndDate() : event.getEventDate();
        java.time.LocalTime fallbackTime = event.getStartTime() != null ? event.getStartTime()
                : java.time.LocalTime.MAX;
        java.time.LocalDateTime eventEnd = event.getEndTime() != null
                ? java.time.LocalDateTime.of(effectiveEndDate, event.getEndTime())
                : java.time.LocalDateTime.of(effectiveEndDate, fallbackTime);

        if (now.isAfter(eventEnd)) {
            throw new BadRequestException("Registration is closed as the event has already ended");
        }

        long confirmedCount = registrationRepository.countByEventAndStatus(event, RegistrationStatus.CONFIRMED);
        RegistrationStatus status = RegistrationStatus.CONFIRMED;
        Integer waitlistPosition = null;

        if (confirmedCount >= event.getCapacity()) {
            status = RegistrationStatus.WAITLISTED;
            long waitlistCount = registrationRepository.countByEventAndStatus(event, RegistrationStatus.WAITLISTED);
            waitlistPosition = (int) waitlistCount + 1;
        }

        Registration registration = Registration.builder()
                .event(Objects.requireNonNull(event))
                .user(Objects.requireNonNull(currentUser))
                .registrationType(RegistrationType.NORMAL)
                .status(status)
                .waitlistPosition(waitlistPosition)
                .build();

        Registration saved = registrationRepository.save(Objects.requireNonNull(registration));
        if (status == RegistrationStatus.CONFIRMED) {
            engagementService.recordRegistration(currentUser);
            notificationService.createNotification(currentUser, "Registration Confirmed",
                    "You have successfully registered for " + event.getTitle(), "REGISTRATION");
        } else {
            notificationService.createNotification(currentUser, "Added to Waitlist",
                    "You are on the waitlist (#" + waitlistPosition + ") for " + event.getTitle() +
                            ". You will be notified if a spot opens up.",
                    "WAITLIST");
        }
        return mapToResponse(saved);
    }

    @LogAudit(action = "REGISTER_ON_SPOT", entityType = "Registration", entityIdExpression = "#result.id")
    public Registration registerOnSpot(Event event, User user) {
        if (!Boolean.TRUE.equals(event.isOnSpotRegistrationEnabled()) && event.getEventMode() != EventMode.INSTANT) {
            throw new BadRequestException("On-spot registration is not allowed for this event");
        }
        if (event.getStatus() == EventStatus.ATTENDANCE_CLOSED || event.getStatus() == EventStatus.CANCELLED) {
            throw new BadRequestException("Cannot register for an event that is completed or cancelled");
        }
        long confirmedCount = registrationRepository.countByEventAndStatus(event, RegistrationStatus.CONFIRMED);
        if (confirmedCount >= event.getCapacity()) {
            throw new BadRequestException(
                    "Event is at full capacity. On-spot registration cannot bypass capacity limits.");
        }

        Registration registration = Registration.builder()
                .event(Objects.requireNonNull(event))
                .user(Objects.requireNonNull(user))
                .registrationType(RegistrationType.ON_SPOT)
                .status(RegistrationStatus.CONFIRMED)
                .build();
        Registration saved = registrationRepository.save(Objects.requireNonNull(registration));

        engagementService.recordRegistration(user);

        return saved;
    }

    @LogAudit(action = "CANCEL_REGISTRATION", entityType = "Registration", entityIdExpression = "#result.id")
    public RegistrationResponse cancelRegistration(Long eventId) {
        if (eventId == null) {
            throw new BadRequestException("Event ID cannot be null");
        }
        User currentUser = authService.getCurrentUser();
        Event event = eventRepository.findById(Objects.requireNonNull(eventId))
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        Registration registration = registrationRepository.findByEventAndUser(event, currentUser)
                .orElseThrow(() -> new ResourceNotFoundException("You are not registered for this event"));

        if (registration.getStatus() == RegistrationStatus.CANCELLED) {
            throw new BadRequestException("Registration is already cancelled");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime eventStart = event.getStartTime() != null
                ? LocalDateTime.of(event.getEventDate(), event.getStartTime())
                : LocalDateTime.of(event.getEventDate(), LocalTime.MIDNIGHT);

        if (now.isAfter(eventStart)) {
            throw new BadRequestException("Cannot cancel registration as the event has already started.");
        }

        // Cancellation deadline policy: block cancellation within 2 hours of event
        // start
        if (now.isAfter(eventStart.minusHours(2))) {
            throw new BadRequestException(
                    "Cancellation is not allowed within 2 hours of the event start time.");
        }

        boolean wasConfirmed = registration.getStatus() == RegistrationStatus.CONFIRMED;
        boolean wasWaitlisted = registration.getStatus() == RegistrationStatus.WAITLISTED;
        registration.setStatus(RegistrationStatus.CANCELLED);
        registration.setCancelledAt(now);
        registration = registrationRepository.save(Objects.requireNonNull(registration));

        if (wasConfirmed) {
            engagementService.recordCancellation(currentUser);
            // Auto-promote first person on the waitlist
            registrationRepository.findFirstByEventAndStatusOrderByRegisteredAtAsc(event, RegistrationStatus.WAITLISTED)
                    .ifPresent(waitlistedReg -> {
                        waitlistedReg.setStatus(RegistrationStatus.CONFIRMED);
                        waitlistedReg.setWaitlistPosition(null);
                        registrationRepository.save(waitlistedReg);
                        engagementService.recordRegistration(waitlistedReg.getUser());
                        // Notify the promoted user
                        notificationService.createNotification(waitlistedReg.getUser(),
                                "You're Off the Waitlist!",
                                "A spot opened up for " + event.getTitle() +
                                        ". Your registration is now confirmed!",
                                "WAITLIST_PROMOTED");
                        log.info("Auto-promoted user {} from waitlist for event {}",
                                waitlistedReg.getUser().getId(), event.getId());
                    });
            // Re-number remaining waitlist positions
            List<Registration> remainingWaitlist = registrationRepository
                    .findByEventAndStatusOrderByRegisteredAtAsc(event, RegistrationStatus.WAITLISTED);
            for (int i = 0; i < remainingWaitlist.size(); i++) {
                remainingWaitlist.get(i).setWaitlistPosition(i + 1);
            }
            registrationRepository.saveAll(remainingWaitlist);
        } else if (wasWaitlisted) {
            // Re-number remaining waitlist positions
            List<Registration> remainingWaitlist = registrationRepository
                    .findByEventAndStatusOrderByRegisteredAtAsc(event, RegistrationStatus.WAITLISTED);
            for (int i = 0; i < remainingWaitlist.size(); i++) {
                remainingWaitlist.get(i).setWaitlistPosition(i + 1);
            }
            registrationRepository.saveAll(remainingWaitlist);
        }
        return mapToResponse(registration);
    }

    public List<RegistrationResponse> getMyRegistrations() {
        User currentUser = authService.getCurrentUser();
        return registrationRepository.findByUser(currentUser).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<RegistrationResponse> getEventRegistrations(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));
        return registrationRepository.findByEvent(event).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private RegistrationResponse mapToResponse(Registration reg) {
        boolean attended = attendanceLogRepository.existsByEventAndUser(reg.getEvent(), reg.getUser());
        String status = "UPCOMING";
        if (attended) {
            status = "PRESENT";
        } else {
            // Check if event has ended
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            java.time.LocalDate effectiveEndDate = reg.getEvent().getEndDate() != null ? reg.getEvent().getEndDate()
                    : reg.getEvent().getEventDate();
            java.time.LocalTime fallbackTime = reg.getEvent().getStartTime() != null ? reg.getEvent().getStartTime()
                    : java.time.LocalTime.MAX;
            java.time.LocalDateTime eventEnd = reg.getEvent().getEndTime() != null
                    ? java.time.LocalDateTime.of(effectiveEndDate, reg.getEvent().getEndTime())
                    : java.time.LocalDateTime.of(effectiveEndDate, fallbackTime);

            if (now.isAfter(eventEnd) || reg.getEvent().getStatus() == EventStatus.ATTENDANCE_CLOSED) {
                status = "ABSENT";
            }
        }

        String regStatusStr = reg.getStatus() != null ? reg.getStatus().name() : "CONFIRMED";

        return RegistrationResponse.builder()
                .id(reg.getId())
                .eventId(reg.getEvent().getId())
                .eventTitle(reg.getEvent().getTitle())
                .eventVenue(reg.getEvent().getVenue())
                .eventDate(reg.getEvent().getEventDate().toString())
                .userId(reg.getUser().getId())
                .userName(reg.getUser().getFullName())
                .studentId(reg.getUser().getStudentId())
                .registeredAt(reg.getRegisteredAt())
                .attended(attended)
                .attendanceStatus(status)
                .registrationStatus(regStatusStr)
                .waitlistPosition(reg.getWaitlistPosition())
                .build();
    }
}
