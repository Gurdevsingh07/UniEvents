package com.university.eventmanagement.controller;

import com.university.eventmanagement.dto.*;
import com.university.eventmanagement.service.AttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import com.university.eventmanagement.security.RequiresPermission;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
@Tag(name = "Attendance", description = "Attendance tracking endpoints")
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping("/checkin")
    @RequiresPermission("ACCESS_VOLUNTEER_PANEL")
    @Operation(summary = "Check in a student (via QR code or student ID)")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkIn(@RequestBody CheckInRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Check-in successful", attendanceService.checkIn(request)));
    }

    @PostMapping("/event/{eventId}/checkin/bulk")
    @RequiresPermission("ACCESS_VOLUNTEER_PANEL")
    @Operation(summary = "Bulk sync offline check-ins for an event")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> bulkOfflineCheckIn(
            @PathVariable Long eventId,
            @RequestBody OfflineCheckInRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Offline sync processed", attendanceService.bulkOfflineCheckIn(eventId, request)));
    }

    @GetMapping("/event/{eventId}")
    @RequiresPermission("VIEW_REPORTS")
    @Operation(summary = "Get attendance list for an event")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getEventAttendance(@PathVariable Long eventId) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getEventAttendance(eventId)));
    }

    @GetMapping("/my")
    @Operation(summary = "Get current student's attendance history")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getMyAttendance() {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getMyAttendance()));
    }

    @PostMapping("/generate-otp/{eventId}")
    @RequiresPermission("ENROLL_EVENT")
    @Operation(summary = "Generate a check-in OTP (Anti-proxy fallback)")
    public ResponseEntity<ApiResponse<OtpResponse>> generateOtp(@PathVariable Long eventId) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.generateCheckInOtp(eventId)));
    }

    @PostMapping("/verify-otp")
    @RequiresPermission("MANAGE_ATTENDANCE")
    @Operation(summary = "Verify a student's check-in OTP (Organizer only)")
    public ResponseEntity<ApiResponse<AttendanceResponse>> verifyOtp(@RequestBody OtpCheckInRequest request) {
        return ResponseEntity
                .ok(ApiResponse.success("OTP verification successful", attendanceService.verifyOtpCheckIn(request)));
    }
}
