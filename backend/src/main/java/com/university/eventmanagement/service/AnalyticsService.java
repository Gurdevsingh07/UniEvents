package com.university.eventmanagement.service;

import com.university.eventmanagement.model.*;
import com.university.eventmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final AttendanceLogRepository attendanceLogRepository;
    private final EventAnalyticsRepository analyticsRepository;
    private final StudentEngagementService engagementService;

    @Transactional
    public void processEventClosure(Long eventId) {
        log.info("Processing event closure and analytics for event ID: {}", eventId);
        Event event = eventRepository.findById(java.util.Objects.requireNonNull(eventId))
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (event.getStatus() != EventStatus.ATTENDANCE_CLOSED && event.getStatus() != EventStatus.ARCHIVED) {
            log.warn("Attempted to run analytics on move event that is not closed: {}", event.getStatus());
            return;
        }

        // 1. Identify and record No-Shows (Feature 4.8)
        List<Registration> confirmedRegistrations = registrationRepository.findByEvent(event).stream()
                .filter(r -> r.getStatus() == RegistrationStatus.CONFIRMED)
                .collect(Collectors.toList());

        long totalConfirmed = confirmedRegistrations.size();
        long totalAttended = attendanceLogRepository.countByEvent(event);
        long onSpotCount = registrationRepository.countByEventAndRegistrationType(event, RegistrationType.ON_SPOT);
        long totalCancelled = registrationRepository.countByEventAndStatus(event, RegistrationStatus.CANCELLED);
        long totalInitialRegistrations = totalConfirmed + totalCancelled;

        for (Registration reg : confirmedRegistrations) {
            boolean attended = attendanceLogRepository.existsByEventAndUser(event, reg.getUser());
            if (!attended) {
                engagementService.recordNoShow(reg.getUser());
            }
        }

        // 2. Aggregate Data (Feature 5.3)
        float attendanceRate = totalConfirmed > 0 ? (float) totalAttended / totalConfirmed * 100 : 0;
        float noShowRate = totalConfirmed > 0
                ? (float) (totalConfirmed - (totalAttended - onSpotCount)) / totalConfirmed * 100
                : 0;

        // Ensure noShowRate isn't negative due to on-spot check-ins exceeding
        // registrations (rare but possible)
        if (noShowRate < 0)
            noShowRate = 0;

        EventAnalytics analytics = analyticsRepository.findByEvent(event)
                .orElse(new EventAnalytics());

        analytics.setEvent(event);
        analytics.setAttendanceRate(attendanceRate);
        analytics.setCancellationRate(
                totalInitialRegistrations > 0 ? (float) totalCancelled / totalInitialRegistrations * 100 : 0);
        analytics.setNoShowRate(noShowRate);
        analytics.setOnSpotPercentage(totalAttended > 0 ? (float) onSpotCount / totalAttended * 100 : 0);
        analytics.setCalculatedAt(LocalDateTime.now());

        // Performance Score Calculation (Example logic)
        float performanceScore = (attendanceRate * 0.7f) - (noShowRate * 0.3f);
        analytics.setPerformanceScore(Math.max(0, Math.min(100, performanceScore)));

        analyticsRepository.save(analytics);
        log.info("Analytics saved for event ID: {}. Performance Score: {}", eventId, performanceScore);
    }
}
