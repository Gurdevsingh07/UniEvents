package com.university.eventmanagement.controller;

import com.university.eventmanagement.dto.*;
import com.university.eventmanagement.service.AttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
@Tag(name = "Attendance", description = "Attendance tracking endpoints")
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping("/checkin")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    @Operation(summary = "Check in a student (via QR code or student ID)")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkIn(@RequestBody CheckInRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Check-in successful", attendanceService.checkIn(request)));
    }

    @GetMapping("/event/{eventId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
    @Operation(summary = "Get attendance list for an event")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getEventAttendance(@PathVariable Long eventId) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getEventAttendance(eventId)));
    }

    @GetMapping("/my")
    @Operation(summary = "Get current student's attendance history")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getMyAttendance() {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getMyAttendance()));
    }
}
