package com.university.eventmanagement.controller;

import com.university.eventmanagement.dto.*;
import com.university.eventmanagement.service.RegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import com.university.eventmanagement.security.RequiresPermission;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Registration", description = "Event registration endpoints")
public class RegistrationController {

    private final RegistrationService registrationService;

    @PostMapping("/events/{eventId}/register")
    @RequiresPermission("ENROLL_EVENT")
    @Operation(summary = "Register for an event")
    public ResponseEntity<ApiResponse<RegistrationResponse>> registerForEvent(@PathVariable Long eventId) {
        return ResponseEntity
                .ok(ApiResponse.success("Registration successful", registrationService.registerForEvent(eventId)));
    }

    @DeleteMapping("/events/{eventId}/register")
    @RequiresPermission("ENROLL_EVENT")
    @Operation(summary = "Cancel registration for an event")
    public ResponseEntity<ApiResponse<RegistrationResponse>> cancelRegistration(@PathVariable Long eventId) {
        return ResponseEntity
                .ok(ApiResponse.success("Registration cancelled successfully",
                        registrationService.cancelRegistration(eventId)));
    }

    @GetMapping("/registrations/my")
    @Operation(summary = "Get current student's registrations")
    public ResponseEntity<ApiResponse<List<RegistrationResponse>>> getMyRegistrations() {
        return ResponseEntity.ok(ApiResponse.success(registrationService.getMyRegistrations()));
    }

    @GetMapping("/events/{eventId}/registrations")
    @RequiresPermission("VIEW_REGISTRATIONS")
    @Operation(summary = "Get all registrations for an event")
    public ResponseEntity<ApiResponse<List<RegistrationResponse>>> getEventRegistrations(@PathVariable Long eventId) {
        return ResponseEntity.ok(ApiResponse.success(registrationService.getEventRegistrations(eventId)));
    }

}
