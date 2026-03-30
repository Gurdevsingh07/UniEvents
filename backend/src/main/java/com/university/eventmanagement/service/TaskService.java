package com.university.eventmanagement.service;

import com.university.eventmanagement.dto.TaskRequest;
import com.university.eventmanagement.dto.TaskResponse;
import com.university.eventmanagement.dto.UserResponse;
import com.university.eventmanagement.exception.ResourceNotFoundException;
import com.university.eventmanagement.model.*;
import com.university.eventmanagement.repository.ClubRepository;
import com.university.eventmanagement.repository.EventRepository;
import com.university.eventmanagement.repository.TaskRepository;
import com.university.eventmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.university.eventmanagement.aspect.LogAudit;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final ClubRepository clubRepository;
    private final AuthService authService;
    private final PermissionService permissionService;

    @Transactional
    @LogAudit(action = "ASSIGN_TASK", entityType = "Task", entityIdExpression = "#result.id")
    public TaskResponse createTask(TaskRequest request) {
        User currentUser = authService.getCurrentUser();

        // Support multiple assignees
        if (request.getAssignedToIds() != null && !request.getAssignedToIds().isEmpty()) {
            TaskResponse lastResponse = null;
            for (Long userId : request.getAssignedToIds()) {
                lastResponse = createSingleTask(request, currentUser, userId);
            }
            return lastResponse;
        }

        // Fallback to single assignee
        if (request.getAssignedToId() == null) {
            throw new IllegalArgumentException("Assigned user is required");
        }
        return createSingleTask(request, currentUser, request.getAssignedToId());
    }

    private TaskResponse createSingleTask(TaskRequest request, User currentUser, Long userId) {
        User assignedTo = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found: " + userId));

        Event event = null;
        if (request.getEventId() != null) {
            event = eventRepository.findById(request.getEventId())
                    .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        }

        Club club = null;
        if (request.getClubId() != null) {
            club = clubRepository.findById(request.getClubId())
                    .orElseThrow(() -> new ResourceNotFoundException("Club not found"));
        }

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .assignedTo(assignedTo)
                .assignedBy(currentUser)
                .event(event)
                .club(club)
                .deadline(request.getDeadline())
                .build();

        task = taskRepository.save(task);
        return mapToResponse(task);
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getMyTasks() {
        User currentUser = authService.getCurrentUser();
        return taskRepository.findByAssignedToIdOrderByDeadlineAsc(currentUser.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getAssignedTasks() {
        User currentUser = authService.getCurrentUser();
        return taskRepository.findByAssignedByIdOrderByCreatedAtDesc(currentUser.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TaskResponse updateTaskStatus(Long taskId, String newStatus) {
        User currentUser = authService.getCurrentUser();
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        boolean canUpdate = currentUser.getId().equals(task.getAssignedTo().getId()) ||
                currentUser.getId().equals(task.getAssignedBy().getId()) ||
                "ADMIN".equals(currentUser.getPrimaryRoleName());

        if (!canUpdate) {
            throw new AccessDeniedException("You don't have permission to update this task");
        }

        try {
            TaskStatus status = TaskStatus.valueOf(newStatus.toUpperCase());
            task.setStatus(status);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid task status");
        }

        return mapToResponse(taskRepository.save(task));
    }

    private TaskResponse mapToResponse(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .assignedTo(UserResponse.builder()
                        .id(task.getAssignedTo().getId())
                        .fullName(task.getAssignedTo().getFullName())
                        .email(task.getAssignedTo().getEmail())
                        .build())
                .assignedBy(UserResponse.builder()
                        .id(task.getAssignedBy().getId())
                        .fullName(task.getAssignedBy().getFullName())
                        .email(task.getAssignedBy().getEmail())
                        .build())
                .eventId(task.getEvent() != null ? task.getEvent().getId() : null)
                .eventTitle(task.getEvent() != null ? task.getEvent().getTitle() : null)
                .clubId(task.getClub() != null ? task.getClub().getId() : null)
                .clubName(task.getClub() != null ? task.getClub().getName() : null)
                .deadline(task.getDeadline())
                .status(task.getStatus().name())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}
