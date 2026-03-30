package com.university.eventmanagement.controller;

import com.university.eventmanagement.dto.*;
import com.university.eventmanagement.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import com.university.eventmanagement.security.RequiresPermission;
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
    @RequiresPermission("ACCESS_VOLUNTEER_PANEL")
    @Operation(summary = "Get events created by current organizer")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getMyEvents() {
        return ResponseEntity.ok(ApiResponse.success(eventService.getMyEvents()));
    }

    @GetMapping("/history")
    @RequiresPermission("ACCESS_VOLUNTEER_PANEL")
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
    @RequiresPermission("VIEW_REPORTS")
    @Operation(summary = "Get live attendance stats for an event")
    public ResponseEntity<ApiResponse<EventStatsResponse>> getEventStats(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(eventService.getEventStats(id)));
    }

    @PostMapping
    @RequiresPermission("MANAGE_EVENTS")
    @Operation(summary = "Create a new event")
    public ResponseEntity<ApiResponse<EventResponse>> createEvent(@Valid @RequestBody EventRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Event created successfully", eventService.createEvent(request)));
    }

    @PutMapping("/{id}")
    @RequiresPermission("MANAGE_EVENTS")
    @Operation(summary = "Update an event")
    public ResponseEntity<ApiResponse<EventResponse>> updateEvent(@PathVariable Long id,
            @Valid @RequestBody EventRequest request) {
        return ResponseEntity
                .ok(ApiResponse.success("Event updated successfully", eventService.updateEvent(id, request)));
    }

    @PutMapping("/{id}/end")
    @RequiresPermission("MANAGE_EVENTS")
    @Operation(summary = "End an event manually")
    public ResponseEntity<ApiResponse<EventResponse>> endEvent(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Event ended successfully", eventService.endEvent(id)));
    }

    @PatchMapping("/{id}/status")
    @RequiresPermission("MANAGE_EVENTS")
    @Operation(summary = "Update event lifecycle status manually")
    public ResponseEntity<ApiResponse<EventResponse>> updateEventStatus(@PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(
                ApiResponse.success("Event status updated successfully", eventService.updateEventStatus(id, status)));
    }

    @DeleteMapping("/{id}")
    @RequiresPermission("MANAGE_EVENTS")
    @Operation(summary = "Delete an event")
    public ResponseEntity<ApiResponse<?>> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return ResponseEntity.ok(ApiResponse.success("Event deleted successfully", null));
    }
}
