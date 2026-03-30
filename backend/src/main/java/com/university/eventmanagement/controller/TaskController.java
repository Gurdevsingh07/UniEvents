package com.university.eventmanagement.controller;

import com.university.eventmanagement.dto.ApiResponse;
import com.university.eventmanagement.dto.TaskRequest;
import com.university.eventmanagement.dto.TaskResponse;
import com.university.eventmanagement.security.RequiresPermission;
import com.university.eventmanagement.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Tag(name = "Tasks", description = "Volunteer System Task Management endpoints")
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    @RequiresPermission("ASSIGN_TASKS")
    @Operation(summary = "Create and assign a new task")
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(@Valid @RequestBody TaskRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Task assigned successfully", taskService.createTask(request)));
    }

    @GetMapping("/my-tasks")
    @RequiresPermission("ACCESS_VOLUNTEER_PANEL")
    @Operation(summary = "Get tasks assigned to me")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getMyTasks() {
        return ResponseEntity.ok(ApiResponse.success(taskService.getMyTasks()));
    }

    @GetMapping("/assigned-by-me")
    @RequiresPermission("ASSIGN_TASKS")
    @Operation(summary = "Get tasks I have assigned")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getAssignedTasks() {
        return ResponseEntity.ok(ApiResponse.success(taskService.getAssignedTasks()));
    }

    @PatchMapping("/{taskId}/status")
    @Operation(summary = "Update task status")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTaskStatus(
            @PathVariable Long taskId,
            @RequestBody Map<String, String> payload) {

        String newStatus = payload.get("status");
        if (newStatus == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Status is required"));
        }

        return ResponseEntity
                .ok(ApiResponse.success("Task status updated", taskService.updateTaskStatus(taskId, newStatus)));
    }
}
