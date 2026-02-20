package com.university.eventmanagement.controller;

import com.university.eventmanagement.dto.*;
import com.university.eventmanagement.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Tag(name = "Events", description = "Event management endpoints")
public class EventController {

    private final EventService eventService;

    @GetMapping
    @Operation(summary = "Get all events")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getAllEvents() {
        return ResponseEntity.ok(ApiResponse.success(eventService.getAllEvents()));
    }

    @GetMapping("/upcoming")
    @Operation(summary = "Get upcoming events")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getUpcomingEvents() {
        return ResponseEntity.ok(ApiResponse.success(eventService.getUpcomingEvents()));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    @Operation(summary = "Get events created by current organizer")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getMyEvents() {
        return ResponseEntity.ok(ApiResponse.success(eventService.getMyEvents()));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    @Operation(summary = "Get event history (Completed & Cancelled)")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getHistoryEvents() {
        return ResponseEntity.ok(ApiResponse.success(eventService.getHistoryEvents()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get event by ID")
    public ResponseEntity<ApiResponse<EventResponse>> getEvent(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(eventService.getEvent(id)));
    }

    @GetMapping("/{id}/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    @Operation(summary = "Get live attendance stats for an event")
    public ResponseEntity<ApiResponse<EventStatsResponse>> getEventStats(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(eventService.getEventStats(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    @Operation(summary = "Create a new event")
    public ResponseEntity<ApiResponse<EventResponse>> createEvent(@Valid @RequestBody EventRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Event created successfully", eventService.createEvent(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    @Operation(summary = "Update an event")
    public ResponseEntity<ApiResponse<EventResponse>> updateEvent(@PathVariable Long id,
            @Valid @RequestBody EventRequest request) {
        return ResponseEntity
                .ok(ApiResponse.success("Event updated successfully", eventService.updateEvent(id, request)));
    }

    @PutMapping("/{id}/end")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    @Operation(summary = "End an event manually")
    public ResponseEntity<ApiResponse<EventResponse>> endEvent(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Event ended successfully", eventService.endEvent(id)));
        } catch (Exception e) {
            try (java.io.PrintWriter pw = new java.io.PrintWriter(new java.io.FileWriter("error.log", true))) {
                e.printStackTrace(pw);
            } catch (java.io.IOException ioe) {
                // If logging fails, fall back to stderr
                ioe.printStackTrace();
            }
            e.printStackTrace(); // Log to console as well
            return ResponseEntity.status(500).body(ApiResponse.error("Internal Server Error: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    @Operation(summary = "Delete an event")
    public ResponseEntity<ApiResponse<?>> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return ResponseEntity.ok(ApiResponse.success("Event deleted successfully", null));
    }
}
