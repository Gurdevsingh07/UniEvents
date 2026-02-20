package com.university.eventmanagement.service;

import com.university.eventmanagement.dto.*;
import com.university.eventmanagement.exception.*;
import com.university.eventmanagement.model.*;
import com.university.eventmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional
@lombok.extern.slf4j.Slf4j
public class EventService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final AttendanceLogRepository attendanceLogRepository;
    private final AuthService authService;

    public EventResponse createEvent(EventRequest request) {
        User currentUser = authService.getCurrentUser();
        Event event = Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .eventDate(request.getEventDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .entryStartTime(request.getEntryStartTime())
                .entryEndTime(request.getEntryEndTime())
                .venue(request.getVenue())
                .capacity(request.getCapacity())
                .status(EventStatus.UPCOMING)
                .createdBy(currentUser)
                .build();
        return mapToResponse(eventRepository.save(event));
    }

    public EventResponse updateEvent(Long id, EventRequest request) {
        if (id == null) {
            throw new BadRequestException("Event ID cannot be null");
        }
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));

        User currentUser = authService.getCurrentUser();
        if (!event.getCreatedBy().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new BadRequestException("You can only update your own events");
        }

        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setEventDate(request.getEventDate());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event.setEntryStartTime(request.getEntryStartTime());
        event.setEntryEndTime(request.getEntryEndTime());
        event.setVenue(request.getVenue());
        event.setCapacity(request.getCapacity());
        return mapToResponse(eventRepository.save(event));
    }

    public EventResponse endEvent(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));

        User currentUser = authService.getCurrentUser();
        if (!event.getCreatedBy().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new BadRequestException("You can only end your own events");
        }

        event.setStatus(EventStatus.COMPLETED);
        return mapToResponse(eventRepository.save(event));
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteEvent(Long id) {
        if (id == null) {
            throw new BadRequestException("Event ID cannot be null");
        }
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));

        User currentUser = authService.getCurrentUser();
        if (!event.getCreatedBy().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new BadRequestException("You can only delete your own events");
        }

        // Soft delete (Cancel) if event is upcoming/ongoing
        if (event.getStatus() == EventStatus.UPCOMING || event.getStatus() == EventStatus.ONGOING) {
            event.setStatus(EventStatus.CANCELLED);
            eventRepository.save(event);
            return; // Return early, do not delete
        }

        // Hard delete if already completed or cancelled
        attendanceLogRepository.deleteByEvent(event);
        registrationRepository.deleteByEvent(event);
        eventRepository.delete(Objects.requireNonNull(event));
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public EventResponse getEvent(Long id) {
        if (id == null) {
            throw new BadRequestException("Event ID cannot be null");
        }
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
        return mapToResponse(event);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<EventResponse> getAllEvents() {
        return eventRepository.findAllByOrderByEventDateDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<EventResponse> getUpcomingEvents() {
        return eventRepository.findByEventDateAfterOrderByEventDateAsc(LocalDate.now().minusDays(1)).stream()
                .filter(e -> e.getStatus() == EventStatus.UPCOMING || e.getStatus() == EventStatus.ONGOING)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<EventResponse> getMyEvents() {
        User currentUser = authService.getCurrentUser();
        // Only return active events (UPCOMING, ONGOING)
        return eventRepository.findByCreatedByAndStatusInOrderByEventDateDesc(
                currentUser, List.of(EventStatus.UPCOMING, EventStatus.ONGOING)).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public EventStatsResponse getEventStats(Long eventId) {
        if (eventId == null) {
            throw new BadRequestException("Event ID cannot be null");
        }
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        long totalRegistered = registrationRepository.countByEvent(event);
        long totalPresent = attendanceLogRepository.countByEvent(event);
        long totalAbsent = totalRegistered - totalPresent;
        double percentage = totalRegistered > 0 ? (double) totalPresent / totalRegistered * 100 : 0;

        // Safely unbox capacity, defaulting to 0 if null (though capacity should not be
        // null based on entity definition)
        int capacity = event.getCapacity() != null ? event.getCapacity() : 0;

        return EventStatsResponse.builder()
                .eventId(event.getId())
                .eventTitle(event.getTitle())
                .capacity(capacity)
                .totalRegistered(totalRegistered)
                .totalPresent(totalPresent)
                .totalAbsent(totalAbsent)
                .attendancePercentage(Math.round(percentage * 100.0) / 100.0)
                .capacityRemaining((int) (capacity - totalRegistered))
                .build();
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<EventResponse> getHistoryEvents() {
        User currentUser = authService.getCurrentUser();
        LocalDate now = LocalDate.now();
        // Show history for the last 6 months to ensure "stayed in past events"
        LocalDate startOfPeriod = now.minusMonths(6);
        LocalDate endOfPeriod = now.withDayOfMonth(now.lengthOfMonth());

        List<Event> events = eventRepository.findByStatusInAndEventDateBetweenOrderByEventDateDesc(
                List.of(EventStatus.COMPLETED, EventStatus.CANCELLED), startOfPeriod, endOfPeriod);

        if (currentUser.getRole() != Role.ADMIN) {
            events = events.stream()
                    .filter(e -> e.getCreatedBy().getId().equals(currentUser.getId()))
                    .collect(Collectors.toList());
        }

        return events.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private EventResponse mapToResponse(Event event) {
        try {
            long regCount = registrationRepository.countByEvent(event);
            long attCount = attendanceLogRepository.countByEvent(event);

            String status = event.getStatus() != null ? event.getStatus().name() : "UNKNOWN";
            String creatorName = "Unknown";
            Long creatorId = null;

            if (event.getCreatedBy() != null) {
                creatorName = event.getCreatedBy().getFullName();
                creatorId = event.getCreatedBy().getId();
            }

            return EventResponse.builder()
                    .id(event.getId())
                    .title(event.getTitle())
                    .description(event.getDescription())
                    .eventDate(event.getEventDate())
                    .startTime(event.getStartTime())
                    .endTime(event.getEndTime())
                    .entryStartTime(event.getEntryStartTime())
                    .entryEndTime(event.getEntryEndTime())
                    .venue(event.getVenue())
                    .capacity(event.getCapacity())
                    .status(status)
                    .createdByName(creatorName)
                    .createdById(creatorId)
                    .registeredCount(regCount)
                    .attendedCount(attCount)
                    .createdAt(event.getCreatedAt())
                    .build();
        } catch (Exception e) {
            log.error("Error mapping event ID: {} - {}", event.getId(), e.getMessage(), e);
            throw e;
        }
    }
}
