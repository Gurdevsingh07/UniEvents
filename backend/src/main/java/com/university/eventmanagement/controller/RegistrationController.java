package com.university.eventmanagement.controller;

import com.university.eventmanagement.dto.*;
import com.university.eventmanagement.service.QrCodeService;
import com.university.eventmanagement.service.RegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Registration", description = "Event registration endpoints")
public class RegistrationController {

    private final RegistrationService registrationService;
    private final QrCodeService qrCodeService;

    @PostMapping("/events/{eventId}/register")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Register for an event")
    public ResponseEntity<ApiResponse<RegistrationResponse>> registerForEvent(@PathVariable Long eventId) {
        return ResponseEntity
                .ok(ApiResponse.success("Registration successful", registrationService.registerForEvent(eventId)));
    }

    @GetMapping("/registrations/my")
    @Operation(summary = "Get current student's registrations")
    public ResponseEntity<ApiResponse<List<RegistrationResponse>>> getMyRegistrations() {
        return ResponseEntity.ok(ApiResponse.success(registrationService.getMyRegistrations()));
    }

    @GetMapping("/events/{eventId}/registrations")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    @Operation(summary = "Get all registrations for an event")
    public ResponseEntity<ApiResponse<List<RegistrationResponse>>> getEventRegistrations(@PathVariable Long eventId) {
        return ResponseEntity.ok(ApiResponse.success(registrationService.getEventRegistrations(eventId)));
    }

    @GetMapping("/registrations/{id}/qr")
    @Operation(summary = "Get QR code image for a registration")
    public ResponseEntity<byte[]> getQrCode(@PathVariable Long id) {
        String qrData = registrationService.getQrCodeData(id);
        byte[] qrImage = qrCodeService.generateQrCode(qrData, 300, 300);
        return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG).body(qrImage);
    }
}
