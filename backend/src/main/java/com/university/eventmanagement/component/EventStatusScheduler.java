package com.university.eventmanagement.component;

import com.university.eventmanagement.model.Event;
import com.university.eventmanagement.model.EventStatus;
import com.university.eventmanagement.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Component
public class EventStatusScheduler {

    @Autowired
    private EventRepository eventRepository;

    @Scheduled(fixedRate = 60000) // Run every minute
    @Transactional
    public void markEventsAsCompleted() {
        LocalDateTime now = LocalDateTime.now();

        // Ideally, this should be an optimized query in Repository, but for simplicity:
        // Find UPCOMING or ONGOING events
        List<Event> activeEvents = eventRepository.findAll().stream()
                .filter(e -> e.getStatus() == EventStatus.UPCOMING || e.getStatus() == EventStatus.ONGOING)
                .toList();

        for (Event event : activeEvents) {
            LocalDateTime endDateTime = null;
            if (event.getEndTime() != null) {
                endDateTime = LocalDateTime.of(event.getEventDate(), event.getEndTime());
            } else {
                // If no end time, assume it ends at end of day? Or 2 hours after start?
                // Let's assume events without end time auto-complete at 23:59 of that day
                endDateTime = LocalDateTime.of(event.getEventDate(), LocalTime.MAX);
            }

            if (now.isAfter(endDateTime)) {
                event.setStatus(EventStatus.COMPLETED);
                eventRepository.save(event);
            } else if (event.getStatus() == EventStatus.UPCOMING) {
                // Auto-start check? User asked for "ongoing" status logic in frontend,
                // but backend status ONGOING is good for consistency.
                LocalDateTime startDateTime = LocalDateTime.of(event.getEventDate(), event.getStartTime());
                if (now.isAfter(startDateTime) && now.isBefore(endDateTime)) {
                    event.setStatus(EventStatus.ONGOING);
                    eventRepository.save(event);
                }
            }
        }
    }
}
