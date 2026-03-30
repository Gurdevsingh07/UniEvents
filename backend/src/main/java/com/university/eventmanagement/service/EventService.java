package com.university.eventmanagement.service;

import com.university.eventmanagement.aspect.LogAudit;
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
    private final ClubRepository clubRepository;
    private final TeamRepository teamRepository;
    private final EventAccessService eventAccessService;
    private final AnalyticsService analyticsService;
    private final NotificationService notificationService;
    private final TeamMemberRepository teamMemberRepository;
    private final EventTeamAssignmentRepository eventTeamAssignmentRepository;

    @LogAudit(action = "CREATE_EVENT", entityType = "Event", entityIdExpression = "#result.id")
    public EventResponse createEvent(EventRequest request) {
        User currentUser = authService.getCurrentUser();

        EventMode mode = EventMode.PRE_SCHEDULED;
        if (request.getEventMode() != null) {
            try {
                mode = EventMode.valueOf(request.getEventMode().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Default to PRE_SCHEDULED
            }
        }

        EventStatus initialStatus = EventStatus.CREATED;
        if (mode == EventMode.INSTANT) {
            initialStatus = EventStatus.ATTENDANCE_ACTIVE;
        }

        Event event = Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .eventDate(request.getEventDate())
                .endDate(request.getEndDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .entryStartTime(request.getEntryStartTime())
                .entryEndTime(request.getEntryEndTime())
                .venue(request.getVenue())
                .capacity(request.getCapacity())
                .eventMode(mode)
                .onSpotRegistrationEnabled(
                        request.getOnSpotRegistrationEnabled() != null && request.getOnSpotRegistrationEnabled())
                .status(initialStatus)
                .attendanceSessionToken(
                        initialStatus == EventStatus.ATTENDANCE_ACTIVE ? java.util.UUID.randomUUID().toString() : null)
                .createdBy(currentUser)
                .build();
        Event savedEvent = eventRepository.save(Objects.requireNonNull(event));

        if (request.getAssignedTeamIds() != null && !request.getAssignedTeamIds().isEmpty()) {
            List<Team> teams = teamRepository.findAllById(request.getAssignedTeamIds());
            for (Team team : teams) {
                EventTeamAssignment assignment = EventTeamAssignment.builder()
                        .event(savedEvent)
                        .team(team)
                        .assignedBy(currentUser)
                        .build();
                eventTeamAssignmentRepository.save(assignment);

                // Notify Team Members
                List<TeamMember> members = teamMemberRepository.findByTeamIdAndIsActiveTrue(team.getId());
                for (TeamMember member : members) {
                    if (member.getUser() != null) {
                        notificationService.sendNotification(member.getUser(), "EVENT_ASSIGNMENT",
                                "Your team has been assigned to help manage the event: " + event.getTitle(),
                                savedEvent);
                    }
                }
            }
        }

        return mapToResponse(savedEvent);
    }

    @LogAudit(action = "UPDATE_EVENT", entityType = "Event", entityIdExpression = "#result.id")
    public EventResponse updateEvent(Long id, EventRequest request) {
        if (id == null) {
            throw new BadRequestException("Event ID cannot be null");
        }
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));

        User currentUser = authService.getCurrentUser();
        if (!eventAccessService.canManageEvent(event, currentUser)) {
            throw new BadRequestException("You do not have permission to update this event");
        }

        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setEventDate(request.getEventDate());
        event.setEndDate(request.getEndDate());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event.setEntryStartTime(request.getEntryStartTime());
        event.setEntryEndTime(request.getEntryEndTime());
        event.setVenue(request.getVenue());
        event.setCapacity(request.getCapacity());

        if (request.getEventMode() != null) {
            try {
                event.setEventMode(EventMode.valueOf(request.getEventMode().toUpperCase()));
            } catch (IllegalArgumentException e) {
                // Ignore invalid mode on update
            }
        }
        if (request.getOnSpotRegistrationEnabled() != null) {
            event.setOnSpotRegistrationEnabled(request.getOnSpotRegistrationEnabled());
        }

        if (request.getAssignedClubId() != null) {
            event.setAssignedClub(
                    clubRepository.findById(Objects.requireNonNull(request.getAssignedClubId())).orElse(null));
        } else {
            event.setAssignedClub(null);
        }

        Event savedEvent = eventRepository.save(Objects.requireNonNull(event));

        eventTeamAssignmentRepository.deleteByEvent(savedEvent);
        if (request.getAssignedTeamIds() != null && !request.getAssignedTeamIds().isEmpty()) {
            List<Team> teams = teamRepository.findAllById(request.getAssignedTeamIds());
            for (Team team : teams) {
                EventTeamAssignment assignment = EventTeamAssignment.builder()
                        .event(savedEvent)
                        .team(team)
                        .assignedBy(currentUser)
                        .build();
                eventTeamAssignmentRepository.save(assignment);

                // Notify Team Members (Feature 6.4)
                List<TeamMember> members = teamMemberRepository.findByTeamIdAndIsActiveTrue(team.getId());
                for (TeamMember member : members) {
                    if (member.getUser() != null) {
                        notificationService.sendNotification(member.getUser(), "EVENT_ASSIGNMENT",
                                "Your team has been assigned to help manage the event: " + event.getTitle(),
                                savedEvent);
                    }
                }
            }
        }

        return mapToResponse(savedEvent);
    }

    @LogAudit(action = "END_EVENT", entityType = "Event", entityIdExpression = "#result.id")
    public EventResponse endEvent(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));

        User currentUser = authService.getCurrentUser();
        if (!eventAccessService.canManageEvent(event, currentUser)) {
            throw new BadRequestException("You do not have permission to end this event");
        }

        validateStateTransition(event.getStatus(), EventStatus.ATTENDANCE_CLOSED);
        event.setStatus(EventStatus.ATTENDANCE_CLOSED);
        Event savedEvent = eventRepository.save(Objects.requireNonNull(event));

        // Trigger Analytics (Feature 4.8, 5.3)
        analyticsService.processEventClosure(savedEvent.getId());

        return mapToResponse(savedEvent);
    }

    @LogAudit(action = "UPDATE_EVENT_STATUS", entityType = "Event", entityIdExpression = "#result.id")
    public EventResponse updateEventStatus(Long id, String statusStr) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));

        User currentUser = authService.getCurrentUser();
        if (!eventAccessService.canManageEvent(event, currentUser)) {
            throw new BadRequestException("You do not have permission to update this event's status");
        }

        try {
            EventStatus newStatus = EventStatus.valueOf(statusStr.toUpperCase());
            validateStateTransition(event.getStatus(), newStatus);

            // Generate token when activating, clear when closing
            if (newStatus == EventStatus.ATTENDANCE_ACTIVE && event.getAttendanceSessionToken() == null) {
                event.setAttendanceSessionToken(java.util.UUID.randomUUID().toString());
            } else if (newStatus == EventStatus.ATTENDANCE_CLOSED || newStatus == EventStatus.CANCELLED
                    || newStatus == EventStatus.ARCHIVED) {
                event.setAttendanceSessionToken(null);
            }

            event.setStatus(newStatus);
            Event savedEvent = eventRepository.save(Objects.requireNonNull(event));

            // Trigger Analytics if closed
            if (newStatus == EventStatus.ATTENDANCE_CLOSED || newStatus == EventStatus.ARCHIVED) {
                analyticsService.processEventClosure(savedEvent.getId());
            }

            return mapToResponse(savedEvent);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid event status: " + statusStr);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    @LogAudit(action = "DELETE_EVENT", entityType = "Event", entityIdExpression = "#id")
    public void deleteEvent(Long id) {
        if (id == null) {
            throw new BadRequestException("Event ID cannot be null");
        }
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));

        User currentUser = authService.getCurrentUser();
        if (!eventAccessService.canManageEvent(event, currentUser)) {
            throw new BadRequestException("You do not have permission to delete this event");
        }

        // Soft delete (Cancel) if event is upcoming/ongoing
        if (event.getStatus() == EventStatus.CREATED || event.getStatus() == EventStatus.ATTENDANCE_ACTIVE
                || event.getStatus() == EventStatus.REGISTRATION_OPEN
                || event.getStatus() == EventStatus.REGISTRATION_CLOSED
                || event.getStatus() == EventStatus.ATTENDANCE_PAUSED) {
            validateStateTransition(event.getStatus(), EventStatus.CANCELLED);
            event.setStatus(EventStatus.CANCELLED);
            eventRepository.save(Objects.requireNonNull(event));
            return; // Return early, do not delete
        }

        // Hard delete if already completed or cancelled
        eventTeamAssignmentRepository.deleteByEvent(event);
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
                .filter(e -> e.getStatus() == EventStatus.CREATED || e.getStatus() == EventStatus.ATTENDANCE_ACTIVE)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<EventResponse> getMyEvents() {
        User currentUser = authService.getCurrentUser();

        List<Event> myCreatedEvents = eventRepository.findByCreatedByAndStatusInOrderByEventDateDesc(
                currentUser, List.of(EventStatus.CREATED, EventStatus.ATTENDANCE_ACTIVE));

        List<TeamMember> myMemberships = teamMemberRepository.findByUserIdAndIsActiveTrue(currentUser.getId());
        List<Event> assignedEvents = new java.util.ArrayList<>();

        for (TeamMember member : myMemberships) {
            List<EventTeamAssignment> assignments = eventTeamAssignmentRepository.findByTeam(member.getTeam());
            for (EventTeamAssignment assignment : assignments) {
                Event e = assignment.getEvent();
                if ((e.getStatus() == EventStatus.CREATED || e.getStatus() == EventStatus.ATTENDANCE_ACTIVE)
                        && !myCreatedEvents.contains(e) && !assignedEvents.contains(e)) {
                    assignedEvents.add(e);
                }
            }
        }

        List<Event> allMyEvents = new java.util.ArrayList<>(myCreatedEvents);
        allMyEvents.addAll(assignedEvents);
        allMyEvents.sort((e1, e2) -> e2.getEventDate().compareTo(e1.getEventDate()));

        return allMyEvents.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public EventStatsResponse getEventStats(Long eventId) {
        if (eventId == null) {
            throw new BadRequestException("Event ID cannot be null");
        }
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        User currentUser = authService.getCurrentUser();
        if (!eventAccessService.canViewReports(event, currentUser)) {
            throw new BadRequestException("You do not have permission to view stats for this event");
        }

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
                List.of(EventStatus.ATTENDANCE_CLOSED, EventStatus.CANCELLED), startOfPeriod, endOfPeriod);

        if (!currentUser.getPrimaryRoleName().equals("ADMIN")) {
            List<TeamMember> myMemberships = teamMemberRepository.findByUserIdAndIsActiveTrue(currentUser.getId());
            List<Team> myTeams = myMemberships.stream().map(TeamMember::getTeam).collect(Collectors.toList());

            events = events.stream()
                    .filter(e -> {
                        if (e.getCreatedBy() != null && e.getCreatedBy().getId().equals(currentUser.getId()))
                            return true;
                        List<EventTeamAssignment> assignments = eventTeamAssignmentRepository.findByEvent(e);
                        for (EventTeamAssignment assignment : assignments) {
                            if (myTeams.contains(assignment.getTeam()))
                                return true;
                        }
                        return false;
                    })
                    .collect(Collectors.toList());
        }

        return events.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private void validateStateTransition(EventStatus current, EventStatus next) {
        if (current == next)
            return;

        boolean valid = switch (current) {
            case CREATED -> next == EventStatus.REGISTRATION_OPEN || next == EventStatus.CANCELLED
                    || next == EventStatus.ATTENDANCE_ACTIVE;
            case REGISTRATION_OPEN -> next == EventStatus.REGISTRATION_CLOSED || next == EventStatus.CANCELLED
                    || next == EventStatus.ATTENDANCE_ACTIVE;
            case REGISTRATION_CLOSED -> next == EventStatus.ATTENDANCE_ACTIVE || next == EventStatus.CANCELLED
                    || next == EventStatus.REGISTRATION_OPEN;
            case ATTENDANCE_ACTIVE -> next == EventStatus.ATTENDANCE_PAUSED || next == EventStatus.ATTENDANCE_CLOSED
                    || next == EventStatus.CANCELLED;
            case ATTENDANCE_PAUSED -> next == EventStatus.ATTENDANCE_ACTIVE || next == EventStatus.ATTENDANCE_CLOSED
                    || next == EventStatus.CANCELLED;
            case ATTENDANCE_CLOSED -> next == EventStatus.ARCHIVED || next == EventStatus.ATTENDANCE_ACTIVE;
            case ARCHIVED -> false;
            case CANCELLED -> false;
            default -> false;
        };

        if (!valid) {
            throw new BadRequestException("Invalid state transition from " + (current != null ? current.name() : "NULL")
                    + " to " + next.name());
        }
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

            List<EventTeamAssignment> assignments = eventTeamAssignmentRepository.findByEvent(event);
            List<TeamBasicDTO> assignedTeams = assignments.stream()
                    .map(a -> TeamBasicDTO.builder()
                            .id(a.getTeam().getId())
                            .name(a.getTeam().getName())
                            .build())
                    .collect(Collectors.toList());

            return EventResponse.builder()
                    .id(event.getId())
                    .title(event.getTitle())
                    .description(event.getDescription())
                    .eventDate(event.getEventDate())
                    .endDate(event.getEndDate())
                    .startTime(event.getStartTime())
                    .endTime(event.getEndTime())
                    .entryStartTime(event.getEntryStartTime())
                    .entryEndTime(event.getEntryEndTime())
                    .venue(event.getVenue())
                    .capacity(event.getCapacity())
                    .status(status)
                    .eventMode(event.getEventMode() != null ? event.getEventMode().name() : "PRE_SCHEDULED")
                    .onSpotRegistrationEnabled(event.isOnSpotRegistrationEnabled())
                    .createdByName(creatorName)
                    .createdById(creatorId)
                    .assignedClubId(event.getAssignedClub() != null ? event.getAssignedClub().getId() : null)
                    .assignedClubName(event.getAssignedClub() != null ? event.getAssignedClub().getName() : null)
                    .assignedTeams(assignedTeams)
                    .attendanceSessionToken(event.getAttendanceSessionToken())
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
