package com.university.eventmanagement.service;

import com.university.eventmanagement.dto.AttendanceResponse;
import com.university.eventmanagement.dto.CheckInRequest;
import com.university.eventmanagement.dto.OfflineCheckInRequest;
import com.university.eventmanagement.exception.*;
import com.university.eventmanagement.model.*;
import com.university.eventmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.university.eventmanagement.aspect.LogAudit;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

        private final AttendanceLogRepository attendanceLogRepository;
        private final RegistrationRepository registrationRepository;
        private final EventRepository eventRepository;
        private final UserRepository userRepository;
        private final AuthService authService;
        private final RegistrationService registrationService;
        private final StudentEngagementService engagementService;
        private final EventAccessService eventAccessService;

        // OTP Cache: studentId -> {eventId -> OtpRecord}
        private final Map<String, Map<Long, OtpRecord>> otpCache = new ConcurrentHashMap<>();

        private record OtpRecord(String code, java.time.LocalDateTime expiresAt) {
        }

        public AttendanceResponse checkIn(CheckInRequest request) {
                if (request.getStudentId() != null && !request.getStudentId().isBlank()
                                && request.getEventId() != null) {
                        // Manual student ID check-in
                        User student = userRepository.findByStudentId(request.getStudentId())
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Student not found with ID: " + request.getStudentId()));
                        Event event = eventRepository.findById(java.util.Objects.requireNonNull(request.getEventId()))
                                        .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

                        // Validate Session Token (Feature 2.8)
                        if (event.getAttendanceSessionToken() != null &&
                                        !event.getAttendanceSessionToken().equals(request.getSessionToken())) {
                                throw new BadRequestException("Invalid or expired attendance session token");
                        }

                        User currentUser = authService.getCurrentUser();
                        if (!eventAccessService.canManualOverride(event, currentUser)) {
                                throw new UnauthorizedException(
                                                "You do not have permission to manually check-in students for this event");
                        }

                        return markAttendance(event, student);
                } else {
                        throw new BadRequestException("Please provide student ID with event ID");
                }
        }

        @LogAudit(action = "MARK_ATTENDANCE", entityType = "AttendanceLog", entityIdExpression = "#result.id")
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

                // Ensure user is registered or attempt ON_SPOT registration
                Registration registration = registrationRepository.findByEventAndUser(event, user).orElse(null);
                if (registration == null) {
                        if (Boolean.TRUE.equals(event.isOnSpotRegistrationEnabled())
                                        || event.getEventMode() == EventMode.INSTANT) {
                                registrationService.registerOnSpot(event, user);
                        } else {
                                throw new BadRequestException(
                                                "User is not registered for this event and on-spot registration is disabled.");
                        }
                }

                // Check for duplicate attendance
                if (attendanceLogRepository.existsByEventAndUser(event, user)) {
                        throw new DuplicateResourceException("Already checked in! Student: " + user.getFullName());
                }

                AttendanceLog log = new AttendanceLog();
                log.setEvent(event);
                log.setUser(user);

                AttendanceLog savedLog = attendanceLogRepository.save(log);
                engagementService.recordAttendance(user);

                return mapToResponse(savedLog);
        }

        public List<AttendanceResponse> bulkOfflineCheckIn(Long eventId, OfflineCheckInRequest request) {
                Event event = eventRepository.findById(java.util.Objects.requireNonNull(eventId))
                                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

                User currentUser = authService.getCurrentUser();
                if (!eventAccessService.canManualOverride(event, currentUser)
                                && !eventAccessService.canScanAttendance(event, currentUser)) {
                        throw new UnauthorizedException(
                                        "You do not have permission to sync offline attendance for this event");
                }

                return request.getCheckIns().stream()
                                .map(checkIn -> {
                                        try {
                                                User user = userRepository.findByStudentId(checkIn.getStudentId())
                                                                .orElseThrow(() -> new ResourceNotFoundException(
                                                                                "Student not found"));

                                                // Offline sync bypasses time window checks. Just record.
                                                Registration registration = registrationRepository
                                                                .findByEventAndUser(event, user).orElse(null);
                                                if (registration == null) {
                                                        if (Boolean.TRUE.equals(event.isOnSpotRegistrationEnabled())
                                                                        || event.getEventMode() == EventMode.INSTANT) {
                                                                registrationService.registerOnSpot(event, user);
                                                        } else {
                                                                throw new BadRequestException("User not registered.");
                                                        }
                                                }

                                                if (attendanceLogRepository.existsByEventAndUser(event, user)) {
                                                        throw new DuplicateResourceException("Already checked in");
                                                }

                                                AttendanceLog log = new AttendanceLog();
                                                log.setEvent(event);
                                                log.setUser(user);
                                                // Use scanned time if provided, else now
                                                log.setCheckedInAt(
                                                                checkIn.getScannedAt() != null ? checkIn.getScannedAt()
                                                                                : java.time.LocalDateTime.now());

                                                AttendanceLog savedLog = attendanceLogRepository.save(log);
                                                engagementService.recordAttendance(user);
                                                return mapToResponse(savedLog);
                                        } catch (Exception e) {
                                                // Log failure but continue processing other students
                                                return null;
                                        }
                                })
                                .filter(java.util.Objects::nonNull)
                                .collect(Collectors.toList());
        }

        public List<AttendanceResponse> getEventAttendance(Long eventId) {
                Event event = eventRepository.findById(java.util.Objects.requireNonNull(eventId))
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Event not found with id: " + eventId));

                User currentUser = authService.getCurrentUser();
                if (!eventAccessService.canViewReports(event, currentUser)) {
                        throw new UnauthorizedException(
                                        "You do not have permission to view attendance sheets for this event");
                }

                List<Registration> registrations = registrationRepository.findByEvent(event);
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                java.time.LocalDate effectiveEndDate = event.getEndDate() != null ? event.getEndDate()
                                : event.getEventDate();
                java.time.LocalTime fallbackTime = event.getStartTime() != null ? event.getStartTime()
                                : java.time.LocalTime.MAX;
                java.time.LocalDateTime eventEnd = event.getEndTime() != null
                                ? java.time.LocalDateTime.of(effectiveEndDate, event.getEndTime())
                                : java.time.LocalDateTime.of(effectiveEndDate, fallbackTime);
                boolean hasEnded = now.isAfter(eventEnd) || event.getStatus() == EventStatus.ATTENDANCE_CLOSED;

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

                                        java.time.LocalDate effectiveEndDate = reg.getEvent().getEndDate() != null
                                                        ? reg.getEvent().getEndDate()
                                                        : reg.getEvent().getEventDate();
                                        java.time.LocalTime fallbackTime = reg.getEvent().getStartTime() != null
                                                        ? reg.getEvent().getStartTime()
                                                        : java.time.LocalTime.MAX;
                                        java.time.LocalDateTime eventEnd = reg.getEvent().getEndTime() != null
                                                        ? java.time.LocalDateTime.of(effectiveEndDate,
                                                                        reg.getEvent().getEndTime())
                                                        : java.time.LocalDateTime.of(effectiveEndDate, fallbackTime);
                                        boolean hasEnded = now.isAfter(eventEnd)
                                                        || reg.getEvent().getStatus() == EventStatus.ATTENDANCE_CLOSED;

                                        return mapToResponseCustom(reg, log, hasEnded);
                                })
                                .collect(Collectors.toList());
        }

        public com.university.eventmanagement.dto.OtpResponse generateCheckInOtp(Long eventId) {
                User currentUser = authService.getCurrentUser();
                String code = String.format("%06d", new Random().nextInt(1000000));

                otpCache.computeIfAbsent(currentUser.getStudentId(), k -> new ConcurrentHashMap<>())
                                .put(eventId, new OtpRecord(code, java.time.LocalDateTime.now().plusMinutes(5)));

                return com.university.eventmanagement.dto.OtpResponse.builder()
                                .otp(code)
                                .expiresInMs(300000)
                                .build();
        }

        @Transactional
        public AttendanceResponse verifyOtpCheckIn(com.university.eventmanagement.dto.OtpCheckInRequest request) {
                User student = userRepository.findByStudentId(request.getStudentId())
                                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
                Event event = eventRepository.findById(request.getEventId())
                                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

                // Validate Session Token
                if (event.getAttendanceSessionToken() != null &&
                                !event.getAttendanceSessionToken().equals(request.getSessionToken())) {
                        throw new BadRequestException("Invalid or expired attendance session token");
                }

                User organizer = authService.getCurrentUser();
                if (!eventAccessService.canManualOverride(event, organizer)) {
                        throw new UnauthorizedException("You do not have permission to verify OTP for this event");
                }

                Map<Long, OtpRecord> userOtps = otpCache.get(student.getStudentId());
                if (userOtps == null || !userOtps.containsKey(event.getId())) {
                        throw new BadRequestException("No valid OTP found for this student/event");
                }

                OtpRecord record = userOtps.get(event.getId());
                if (record.expiresAt().isBefore(java.time.LocalDateTime.now())) {
                        userOtps.remove(event.getId());
                        throw new BadRequestException("OTP has expired");
                }

                if (!record.code().equals(request.getOtp())) {
                        throw new BadRequestException("Invalid OTP code");
                }

                // Consume OTP
                userOtps.remove(event.getId());

                return markAttendance(event, student);
        }

        private AttendanceResponse mapToResponse(AttendanceLog log) {
                return AttendanceResponse.builder()
                                .id(log.getId())
                                .eventId(log.getEvent().getId())
                                .eventTitle(log.getEvent().getTitle())
                                .userId(log.getUser().getId())
                                .userName(log.getUser().getFullName())
                                .studentId(log.getUser().getStudentId())
                                .department(log.getUser().getDepartment() != null
                                                ? log.getUser().getDepartment().getName()
                                                : null)
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
                                .department(reg.getUser().getDepartment() != null
                                                ? reg.getUser().getDepartment().getName()
                                                : null)
                                .checkedInAt(log != null ? log.getCheckedInAt() : null)
                                .status(log != null ? "PRESENT" : (hasEnded ? "ABSENT" : "REGISTERED"))
                                .build();
        }
}
