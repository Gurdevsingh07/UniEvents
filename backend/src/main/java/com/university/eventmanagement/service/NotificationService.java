package com.university.eventmanagement.service;

import com.university.eventmanagement.model.*;
import com.university.eventmanagement.repository.EventRepository;
import com.university.eventmanagement.repository.NotificationRepository;
import com.university.eventmanagement.repository.RegistrationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;

    /**
     * Generic notification creator — used by RegistrationService,
     * AttendanceService, etc.
     */
    public void createNotification(User user, String title, String message, String type) {
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .message("[" + title + "] " + message)
                .status("UNREAD")
                .build();
        notificationRepository.save(Objects.requireNonNull(notification));
    }

    /**
     * Sends a notification tied to a specific event.
     */
    public void sendNotification(User user, String type, String message, Event event) {
        Notification notification = Notification.builder()
                .user(user)
                .event(event)
                .type(type)
                .message(message)
                .status("UNREAD")
                .build();
        notificationRepository.save(Objects.requireNonNull(notification));
    }

    /**
     * Sends attendance confirmation notification right after a face scan.
     */
    public void sendAttendanceConfirmation(User user, Event event) {
        sendNotification(user, "ATTENDANCE_CONFIRMED",
                "✅ Your attendance for '" + event.getTitle() + "' has been recorded. Thank you for attending!",
                event);
    }

    /**
     * Notifies all team members when a team is assigned to an event.
     */
    public void sendTeamEventAssignmentNotification(List<User> teamMembers, String teamName, Event event) {
        for (User member : teamMembers) {
            sendNotification(member, "TEAM_EVENT_ASSIGNED",
                    "🎯 Your team '" + teamName + "' has been assigned to manage event: '" +
                            event.getTitle() + "'. Check your volunteer dashboard for details.",
                    event);
        }
    }

    /**
     * Certificate issued notification.
     */
    public void sendCertificateIssuedNotification(User user, Event event) {
        sendNotification(user, "CERTIFICATE_ISSUED",
                "🏆 Your attendance certificate for '" + event.getTitle() +
                        "' is ready! Download it from your registrations page.",
                event);
    }

    /**
     * 24hr and 1hr reminder scheduler — runs every hour.
     */
    @Scheduled(fixedRate = 3600000)
    public void sendEventReminders() {
        LocalDateTime now = LocalDateTime.now();

        List<Event> events = eventRepository.findAll().stream()
                .filter(e -> e.getStatus() == EventStatus.CREATED ||
                        e.getStatus() == EventStatus.REGISTRATION_OPEN)
                .toList();

        for (Event event : events) {
            if (event.getEventDate() == null)
                continue;
            LocalTime startTime = event.getStartTime() != null ? event.getStartTime() : LocalTime.of(9, 0);
            LocalDateTime eventStart = LocalDateTime.of(event.getEventDate(), startTime);

            // 24hr reminder window: between 23h and 25h before event
            boolean is24hrWindow = eventStart.isAfter(now.plusHours(23))
                    && eventStart.isBefore(now.plusHours(25));

            // 1hr reminder window: between 50min and 70min before event
            boolean is1hrWindow = eventStart.isAfter(now.plusMinutes(50))
                    && eventStart.isBefore(now.plusMinutes(70));

            if (!is24hrWindow && !is1hrWindow)
                continue;

            String reminderType = is1hrWindow ? "REMINDER_1HR" : "REMINDER_24HR";
            String timeText = is1hrWindow ? "1 hour" : "24 hours";

            // De-dup: skip if we've already sent this type for this event
            boolean alreadySent = notificationRepository.findAll().stream()
                    .anyMatch(n -> n.getEvent() != null
                            && n.getEvent().getId().equals(event.getId())
                            && reminderType.equals(n.getType()));
            if (alreadySent)
                continue;

            List<Registration> confirmedRegs = registrationRepository.findByEvent(event).stream()
                    .filter(r -> r.getStatus() == RegistrationStatus.CONFIRMED)
                    .toList();

            int count = 0;
            for (Registration reg : confirmedRegs) {
                sendNotification(reg.getUser(), reminderType,
                        "⏰ Reminder: '" + event.getTitle() + "' starts in " + timeText + "! " +
                                "Venue: " + (event.getVenue() != null ? event.getVenue() : "TBD"),
                        event);
                count++;
            }
            if (count > 0) {
                log.info("Sent {} '{}' reminders for event '{}'", count, timeText, event.getTitle());
            }
        }
    }
}
