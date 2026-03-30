package com.university.eventmanagement.controller;

import com.university.eventmanagement.service.AttendanceSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/attendance/session")
@RequiredArgsConstructor
public class AttendanceSessionController {

    private final AttendanceSessionService sessionService;

    /**
     * Start an attendance scanning session for an event.
     * Only organizers, admins, or volunteers with scan permission can do this.
     */
    @PostMapping("/start/{eventId}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN') or @permissionService.canScanAttendanceForEvent(#eventId)")
    public ResponseEntity<Map<String, Object>> startSession(@PathVariable Long eventId) {
        Map<String, Object> result = sessionService.startSession(eventId);
        return ResponseEntity.ok(result);
    }

    /**
     * Pause an active scanning session.
     */
    @PostMapping("/pause/{eventId}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN') or @permissionService.canScanAttendanceForEvent(#eventId)")
    public ResponseEntity<Map<String, Object>> pauseSession(@PathVariable Long eventId) {
        Map<String, Object> result = sessionService.pauseSession(eventId);
        return ResponseEntity.ok(result);
    }

    /**
     * Resume a paused scanning session.
     */
    @PostMapping("/resume/{eventId}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN') or @permissionService.canScanAttendanceForEvent(#eventId)")
    public ResponseEntity<Map<String, Object>> resumeSession(@PathVariable Long eventId) {
        Map<String, Object> result = sessionService.resumeSession(eventId);
        return ResponseEntity.ok(result);
    }

    /**
     * Close the scanning session (cannot be re-opened).
     */
    @PostMapping("/close/{eventId}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> closeSession(@PathVariable Long eventId) {
        Map<String, Object> result = sessionService.closeSession(eventId);
        return ResponseEntity.ok(result);
    }

    /**
     * Get current session status for an event.
     * Available to everyone who can view the event.
     */
    @GetMapping("/status/{eventId}")
    public ResponseEntity<Map<String, Object>> getSessionStatus(@PathVariable Long eventId) {
        Map<String, Object> result = sessionService.getSessionStatus(eventId);
        return ResponseEntity.ok(result);
    }
}
