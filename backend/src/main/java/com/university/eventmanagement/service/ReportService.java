package com.university.eventmanagement.service;

import com.university.eventmanagement.exception.ResourceNotFoundException;
import com.university.eventmanagement.model.*;
import com.university.eventmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.io.font.constants.StandardFonts;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

        private final EventRepository eventRepository;
        private final RegistrationRepository registrationRepository;
        private final AttendanceLogRepository attendanceLogRepository;

        public byte[] generatePdfReport(Long eventId) {
                Event event = eventRepository.findById(eventId)
                                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

                List<Registration> registrations = registrationRepository.findByEvent(event);
                List<AttendanceLog> attendanceLogs = attendanceLogRepository.findByEvent(event);

                try {
                        ByteArrayOutputStream baos = new ByteArrayOutputStream();
                        PdfWriter writer = new PdfWriter(baos);
                        PdfDocument pdf = new PdfDocument(writer);
                        Document document = new Document(pdf);

                        PdfFont boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
                        PdfFont normalFont = PdfFontFactory.createFont(StandardFonts.HELVETICA);

                        // Title
                        document.add(new Paragraph("Attendance Report")
                                        .setFont(boldFont).setFontSize(20).setTextAlignment(TextAlignment.CENTER));
                        document.add(new Paragraph(event.getTitle())
                                        .setFont(boldFont).setFontSize(16).setTextAlignment(TextAlignment.CENTER));
                        document.add(
                                        new Paragraph("Date: "
                                                        + event.getEventDate().format(
                                                                        DateTimeFormatter.ofPattern("dd MMM yyyy"))
                                                        + " | Venue: " + event.getVenue())
                                                        .setFont(normalFont).setFontSize(11)
                                                        .setTextAlignment(TextAlignment.CENTER));
                        document.add(new Paragraph(" "));

                        // Stats
                        long totalRegistered = registrations.size();
                        long totalPresent = attendanceLogs.size();
                        double percentage = totalRegistered > 0 ? (double) totalPresent / totalRegistered * 100 : 0;

                        document.add(new Paragraph("Summary")
                                        .setFont(boldFont).setFontSize(14));
                        document.add(new Paragraph(String.format(
                                        "Total Registered: %d | Total Present: %d | Absent: %d | Attendance: %.1f%%",
                                        totalRegistered, totalPresent, totalRegistered - totalPresent, percentage))
                                        .setFont(normalFont).setFontSize(11));
                        document.add(new Paragraph(" "));

                        // Table
                        Table table = new Table(UnitValue.createPercentArray(new float[] { 1, 3, 2, 2, 2 }))
                                        .useAllAvailableWidth();

                        // Header
                        String[] headers = { "#", "Name", "Student ID", "Department", "Status" };
                        for (String header : headers) {
                                table.addHeaderCell(new Cell()
                                                .add(new Paragraph(header).setFont(boldFont).setFontSize(10)));
                        }

                        // Rows
                        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("HH:mm:ss");
                        int index = 1;
                        for (Registration reg : registrations) {
                                User student = reg.getUser();
                                boolean present = attendanceLogs.stream()
                                                .anyMatch(a -> a.getUser().getId().equals(student.getId()));
                                String checkInTime = attendanceLogs.stream()
                                                .filter(a -> a.getUser().getId().equals(student.getId()))
                                                .findFirst()
                                                .map(a -> a.getCheckedInAt().format(timeFormat))
                                                .orElse("");

                                table.addCell(
                                                new Cell().add(new Paragraph(String.valueOf(index++))
                                                                .setFont(normalFont).setFontSize(9)));
                                table.addCell(new Cell().add(new Paragraph(student.getFullName()).setFont(normalFont)
                                                .setFontSize(9)));
                                table.addCell(
                                                new Cell().add(new Paragraph(
                                                                student.getStudentId() != null ? student.getStudentId()
                                                                                : "N/A")
                                                                .setFont(normalFont).setFontSize(9)));
                                table.addCell(
                                                new Cell().add(new Paragraph(student.getDepartment() != null
                                                                ? student.getDepartment().getName()
                                                                : "N/A")
                                                                .setFont(normalFont).setFontSize(9)));
                                table.addCell(new Cell()
                                                .add(new Paragraph(present ? "Present (" + checkInTime + ")" : "Absent")
                                                                .setFont(normalFont).setFontSize(9)));
                        }

                        document.add(table);
                        document.close();

                        return baos.toByteArray();
                } catch (IOException e) {
                        throw new RuntimeException("Failed to generate PDF report", e);
                }
        }

        public byte[] generateCsvReport(Long eventId) {
                Event event = eventRepository.findById(eventId)
                                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

                List<Registration> registrations = registrationRepository.findByEvent(event);
                List<AttendanceLog> attendanceLogs = attendanceLogRepository.findByEvent(event);

                StringBuilder csv = new StringBuilder();
                csv.append("S.No,Name,Student ID,Email,Department,Status,Check-in Time\n");

                DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                int index = 1;
                for (Registration reg : registrations) {
                        User student = reg.getUser();
                        boolean present = attendanceLogs.stream()
                                        .anyMatch(a -> a.getUser().getId().equals(student.getId()));
                        String checkInTime = attendanceLogs.stream()
                                        .filter(a -> a.getUser().getId().equals(student.getId()))
                                        .findFirst()
                                        .map(a -> a.getCheckedInAt().format(timeFormat))
                                        .orElse("");

                        csv.append(String.format("%d,%s,%s,%s,%s,%s,%s\n",
                                        index++,
                                        student.getFullName(),
                                        student.getStudentId() != null ? student.getStudentId() : "N/A",
                                        student.getEmail(),
                                        student.getDepartment() != null ? student.getDepartment().getName() : "N/A",
                                        present ? "Present" : "Absent",
                                        checkInTime));
                }

                return csv.toString().getBytes();
        }

        public byte[] generateExcelReport(Long eventId) {
                Event event = eventRepository.findById(eventId)
                                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

                List<Registration> registrations = registrationRepository.findByEvent(event);
                List<AttendanceLog> attendanceLogs = attendanceLogRepository.findByEvent(event);

                try (Workbook workbook = new XSSFWorkbook()) {
                        Sheet sheet = workbook.createSheet("Attendance Report");

                        // Header style
                        CellStyle headerStyle = workbook.createCellStyle();
                        Font headerFont = workbook.createFont();
                        headerFont.setBold(true);
                        headerStyle.setFont(headerFont);

                        // Create header row
                        Row headerRow = sheet.createRow(0);
                        String[] columns = { "S.No", "Name", "Student ID", "Email", "Department", "Status",
                                        "Check-in Time" };
                        for (int i = 0; i < columns.length; i++) {
                                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                                cell.setCellValue(columns[i]);
                                cell.setCellStyle(headerStyle);
                        }

                        // Data rows
                        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                        int rowNum = 1;
                        for (Registration reg : registrations) {
                                User student = reg.getUser();
                                boolean present = attendanceLogs.stream()
                                                .anyMatch(a -> a.getUser().getId().equals(student.getId()));
                                String checkInTime = attendanceLogs.stream()
                                                .filter(a -> a.getUser().getId().equals(student.getId()))
                                                .findFirst()
                                                .map(a -> a.getCheckedInAt().format(timeFormat))
                                                .orElse("");

                                Row row = sheet.createRow(rowNum);
                                row.createCell(0).setCellValue(rowNum);
                                row.createCell(1).setCellValue(student.getFullName());
                                row.createCell(2).setCellValue(
                                                student.getStudentId() != null ? student.getStudentId() : "N/A");
                                row.createCell(3).setCellValue(student.getEmail());
                                row.createCell(4)
                                                .setCellValue(student.getDepartment() != null
                                                                ? student.getDepartment().getName()
                                                                : "N/A");
                                row.createCell(5).setCellValue(present ? "Present" : "Absent");
                                row.createCell(6).setCellValue(checkInTime);
                                rowNum++;
                        }

                        // Auto-size columns
                        for (int i = 0; i < columns.length; i++) {
                                sheet.autoSizeColumn(i);
                        }

                        ByteArrayOutputStream baos = new ByteArrayOutputStream();
                        workbook.write(baos);
                        return baos.toByteArray();
                } catch (IOException e) {
                        throw new RuntimeException("Failed to generate Excel report", e);
                }
        }
}
