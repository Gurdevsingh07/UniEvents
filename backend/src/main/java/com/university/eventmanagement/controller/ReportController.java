package com.university.eventmanagement.controller;

import com.university.eventmanagement.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'ORGANIZER')")
@Tag(name = "Reports", description = "Report generation endpoints")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/events/{eventId}/pdf")
    @Operation(summary = "Download attendance report as PDF")
    public ResponseEntity<byte[]> downloadPdfReport(@PathVariable Long eventId) {
        byte[] pdf = reportService.generatePdfReport(eventId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=attendance_report_event_" + eventId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/events/{eventId}/csv")
    @Operation(summary = "Download attendance report as CSV")
    public ResponseEntity<byte[]> downloadCsvReport(@PathVariable Long eventId) {
        byte[] csv = reportService.generateCsvReport(eventId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=attendance_report_event_" + eventId + ".csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping("/events/{eventId}/excel")
    @Operation(summary = "Download attendance report as Excel")
    public ResponseEntity<byte[]> downloadExcelReport(@PathVariable Long eventId) {
        byte[] excel = reportService.generateExcelReport(eventId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=attendance_report_event_" + eventId + ".xlsx")
                .contentType(
                        MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excel);
    }
}
