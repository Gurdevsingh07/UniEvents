package com.university.eventmanagement.service;

import com.university.eventmanagement.dto.RegistrationResponse;
import com.university.eventmanagement.exception.*;
import com.university.eventmanagement.model.*;
import com.university.eventmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final AttendanceLogRepository attendanceLogRepository;
    private final AuthService authService;

    public RegistrationResponse registerForEvent(Long eventId) {
        User currentUser = authService.getCurrentUser();
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        if (registrationRepository.existsByEventAndUser(event, currentUser)) {
            throw new DuplicateResourceException("You are already registered for this event");
        }

        if (event.getStatus() == EventStatus.COMPLETED || event.getStatus() == EventStatus.CANCELLED) {
            throw new BadRequestException("Cannot register for an event that is completed or cancelled");
        }

        // Time-based check: Close registration if event has ended (or started if no end
        // time)
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDateTime eventEnd = event.getEndTime() != null
                ? java.time.LocalDateTime.of(event.getEventDate(), event.getEndTime())
                : java.time.LocalDateTime.of(event.getEventDate(), event.getStartTime());

        if (now.isAfter(eventEnd)) {
            throw new BadRequestException("Registration is closed as the event has already ended");
        }

        long regCount = registrationRepository.countByEvent(event);
        if (regCount >= event.getCapacity()) {
            throw new BadRequestException("Event is at full capacity");
        }

        String qrData = "EVT-" + eventId + "-USR-" + currentUser.getId() + "-"
                + UUID.randomUUID().toString().substring(0, 8);

        Registration registration = Registration.builder()
                .event(event)
                .user(currentUser)
                .qrCodeData(qrData)
                .build();

        return mapToResponse(registrationRepository.save(registration));
    }

    public List<RegistrationResponse> getMyRegistrations() {
        User currentUser = authService.getCurrentUser();
        return registrationRepository.findByUser(currentUser).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<RegistrationResponse> getEventRegistrations(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));
        return registrationRepository.findByEvent(event).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public String getQrCodeData(Long registrationId) {
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found"));
        User currentUser = authService.getCurrentUser();
        if (!registration.getUser().getId().equals(currentUser.getId()) &&
                currentUser.getRole() == Role.STUDENT) {
            throw new BadRequestException("You can only access your own QR codes");
        }
        return registration.getQrCodeData();
    }

    private RegistrationResponse mapToResponse(Registration reg) {
        boolean attended = attendanceLogRepository.existsByEventAndUser(reg.getEvent(), reg.getUser());
        String status = "UPCOMING";
        if (attended) {
            status = "PRESENT";
        } else {
            // Check if event has ended
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            java.time.LocalDateTime eventEnd = reg.getEvent().getEndTime() != null
                    ? java.time.LocalDateTime.of(reg.getEvent().getEventDate(), reg.getEvent().getEndTime())
                    : java.time.LocalDateTime.of(reg.getEvent().getEventDate(), reg.getEvent().getStartTime());

            if (now.isAfter(eventEnd) || reg.getEvent().getStatus() == EventStatus.COMPLETED) {
                status = "ABSENT";
            }
        }

        return RegistrationResponse.builder()
                .id(reg.getId())
                .eventId(reg.getEvent().getId())
                .eventTitle(reg.getEvent().getTitle())
                .eventVenue(reg.getEvent().getVenue())
                .eventDate(reg.getEvent().getEventDate().toString())
                .userId(reg.getUser().getId())
                .userName(reg.getUser().getFullName())
                .studentId(reg.getUser().getStudentId())
                .qrCodeData(reg.getQrCodeData())
                .registeredAt(reg.getRegisteredAt())
                .attended(attended)
                .attendanceStatus(status)
                .build();
    }
}
