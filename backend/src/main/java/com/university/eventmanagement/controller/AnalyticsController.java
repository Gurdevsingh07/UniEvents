package com.university.eventmanagement.controller;

import com.university.eventmanagement.dto.ApiResponse;
import com.university.eventmanagement.model.*;
import com.university.eventmanagement.repository.AttendanceScanLogRepository;
import com.university.eventmanagement.repository.EventAnalyticsRepository;
import com.university.eventmanagement.repository.EventRepository;
import com.university.eventmanagement.repository.UserRepository;
import com.university.eventmanagement.service.AuthService;
import com.university.eventmanagement.service.StudentEngagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Endpoints for engagement and event performance data")
public class AnalyticsController {

    private final StudentEngagementService engagementService;
    private final EventAnalyticsRepository analyticsRepository;
    private final EventRepository eventRepository;
    private final AttendanceScanLogRepository scanLogRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    @GetMapping("/student/engagement")
    @Operation(summary = "Get engagement score for the current student")
    public ResponseEntity<ApiResponse<StudentEngagement>> getStudentEngagement() {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(engagementService.getOrCreateEngagement(currentUser)));
    }

    @GetMapping("/events/{eventId}")
    @Operation(summary = "Get performance analytics for a specific event")
    public ResponseEntity<ApiResponse<EventAnalytics>> getEventAnalytics(@PathVariable Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        EventAnalytics analytics = analyticsRepository.findByEvent(event)
                .orElseThrow(() -> new RuntimeException(
                        "Analytics not yet calculated for this event. Analytics are processed after attendance closes."));

        return ResponseEntity.ok(ApiResponse.success(analytics));
    }

    @GetMapping("/system/health")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get system health and status (Admin only)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSystemHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", java.time.LocalDateTime.now());
        health.put("totalUsers", userRepository.count());
        health.put("totalEvents", eventRepository.count());
        health.put("totalScans", scanLogRepository.count());

        Runtime runtime = Runtime.getRuntime();
        health.put("memory", Map.of(
                "total", runtime.totalMemory() / (1024 * 1024) + " MB",
                "free", runtime.freeMemory() / (1024 * 1024) + " MB",
                "max", runtime.maxMemory() / (1024 * 1024) + " MB"));

        return ResponseEntity.ok(ApiResponse.success(health));
    }

    @GetMapping("/latency/stats")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ORGANIZER')")
    @Operation(summary = "Get recognition latency statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLatencyStats(
            @RequestParam(required = false) Long eventId) {
        Map<String, Object> stats = new HashMap<>();
        if (eventId != null) {
            stats.put("averageLatencyMs", scanLogRepository.findAverageLatencyByEventId(eventId));
            stats.put("eventId", eventId);
        } else {
            stats.put("overallAverageLatencyMs", scanLogRepository.findOverallAverageLatency());
        }
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
