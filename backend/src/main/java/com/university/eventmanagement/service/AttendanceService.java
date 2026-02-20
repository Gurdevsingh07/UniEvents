package com.university.eventmanagement.service;

import com.university.eventmanagement.dto.AttendanceResponse;
import com.university.eventmanagement.dto.CheckInRequest;
import com.university.eventmanagement.exception.*;
import com.university.eventmanagement.model.*;
import com.university.eventmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

        private final AttendanceLogRepository attendanceLogRepository;
        private final RegistrationRepository registrationRepository;
        private final EventRepository eventRepository;
        private final UserRepository userRepository;
        private final AuthService authService;

        public AttendanceResponse checkIn(CheckInRequest request) {
                Registration registration;

                if (request.getQrCodeData() != null && !request.getQrCodeData().isBlank()) {
                        // QR-code based check-in
                        registration = registrationRepository.findByQrCodeData(request.getQrCodeData())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Invalid QR code. Student is not registered for this event."));
                } else if (request.getStudentId() != null && !request.getStudentId().isBlank()
                                && request.getEventId() != null) {
                        // Manual student ID check-in
                        User student = userRepository.findByStudentId(request.getStudentId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Student not found with ID: " + request.getStudentId()));
                        Event event = eventRepository.findById(java.util.Objects.requireNonNull(request.getEventId()))
                                        .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
                        registration = registrationRepository.findByEventAndUser(event, student)
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Student is not registered for this event"));
                } else {
                        throw new BadRequestException("Please provide either QR code data or student ID with event ID");
                }

                Event event = registration.getEvent();
                User user = registration.getUser();

                return markAttendance(event, user);
        }

        public AttendanceResponse markAttendance(Event event, User user) {
                // Check Entry Time Window
                if (event.getEntryStartTime() != null || event.getEntryEndTime() != null) {
                        java.time.LocalTime now = java.time.LocalTime.now();
                        if (event.getEntryStartTime() != null && now.isBefore(event.getEntryStartTime())) {
                                throw new BadRequestException(
                                                "Entry has not started yet. Starts at: " + event.getEntryStartTime());
                        }
                        if (event.getEntryEndTime() != null && now.isAfter(event.getEntryEndTime())) {
                                throw new BadRequestException("Entry is closed. Ended at: " + event.getEntryEndTime());
                        }
                }

                // Check for duplicate attendance
                if (attendanceLogRepository.existsByEventAndUser(event, user)) {
                        throw new DuplicateResourceException("Already checked in! Student: " + user.getFullName());
                }

                AttendanceLog log = new AttendanceLog();
                log.setEvent(event);
                log.setUser(user);
                return mapToResponse(attendanceLogRepository.save(log));
        }

        public List<AttendanceResponse> getEventAttendance(Long eventId) {
                Event event = eventRepository.findById(java.util.Objects.requireNonNull(eventId))
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Event not found with id: " + eventId));
                List<Registration> registrations = registrationRepository.findByEvent(event);
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                java.time.LocalDateTime eventEnd = event.getEndTime() != null
                                ? java.time.LocalDateTime.of(event.getEventDate(), event.getEndTime())
                                : java.time.LocalDateTime.of(event.getEventDate(), event.getStartTime());
                boolean hasEnded = now.isAfter(eventEnd) || event.getStatus() == EventStatus.COMPLETED;

                return registrations.stream()
                                .map(reg -> {
                                        AttendanceLog log = attendanceLogRepository
                                                        .findByEventAndUser(event, reg.getUser()).orElse(null);
                                        return mapToResponseCustom(reg, log, hasEnded);
                                })
                                .collect(Collectors.toList());
        }

        public List<AttendanceResponse> getMyAttendance() {
                User currentUser = authService.getCurrentUser();
                List<Registration> registrations = registrationRepository.findByUser(currentUser);
                java.time.LocalDateTime now = java.time.LocalDateTime.now();

                return registrations.stream()
                                .map(reg -> {
                                        AttendanceLog log = attendanceLogRepository
                                                        .findByEventAndUser(reg.getEvent(), currentUser)
                                                        .orElse(null);

                                        java.time.LocalDateTime eventEnd = reg.getEvent().getEndTime() != null
                                                        ? java.time.LocalDateTime.of(reg.getEvent().getEventDate(),
                                                                        reg.getEvent().getEndTime())
                                                        : java.time.LocalDateTime.of(reg.getEvent().getEventDate(),
                                                                        reg.getEvent().getStartTime());
                                        boolean hasEnded = now.isAfter(eventEnd)
                                                        || reg.getEvent().getStatus() == EventStatus.COMPLETED;

                                        return mapToResponseCustom(reg, log, hasEnded);
                                })
                                .collect(Collectors.toList());
        }

        private AttendanceResponse mapToResponse(AttendanceLog log) {
                return AttendanceResponse.builder()
                                .id(log.getId())
                                .eventId(log.getEvent().getId())
                                .eventTitle(log.getEvent().getTitle())
                                .userId(log.getUser().getId())
                                .userName(log.getUser().getFullName())
                                .studentId(log.getUser().getStudentId())
                                .department(log.getUser().getDepartment())
                                .checkedInAt(log.getCheckedInAt())
                                .status("PRESENT")
                                .build();
        }

        private AttendanceResponse mapToResponseCustom(Registration reg, AttendanceLog log, boolean hasEnded) {
                return AttendanceResponse.builder()
                                .id(log != null ? log.getId() : null)
                                .eventId(reg.getEvent().getId())
                                .eventTitle(reg.getEvent().getTitle())
                                .userId(reg.getUser().getId())
                                .userName(reg.getUser().getFullName())
                                .studentId(reg.getUser().getStudentId())
                                .department(reg.getUser().getDepartment())
                                .checkedInAt(log != null ? log.getCheckedInAt() : null)
                                .status(log != null ? "PRESENT" : (hasEnded ? "ABSENT" : "REGISTERED"))
                                .build();
        }
}
