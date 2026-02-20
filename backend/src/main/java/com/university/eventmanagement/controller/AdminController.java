package com.university.eventmanagement.controller;

import com.university.eventmanagement.dto.*;
import com.university.eventmanagement.model.Role;
import com.university.eventmanagement.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Admin management endpoints")
public class AdminController {

    private final AdminService adminService;

    @PostMapping(value = "/organizers", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Create a new organizer account with profile picture")
    public ResponseEntity<ApiResponse<UserResponse>> createOrganizer(
            @Valid @RequestPart("data") CreateOrganizerRequest request,
            @RequestPart(value = "file", required = false) org.springframework.web.multipart.MultipartFile file) {
        return ResponseEntity
                .ok(ApiResponse.success("Organizer created successfully", adminService.createOrganizer(request, file)));
    }

    @PutMapping("/users/{id}")
    @Operation(summary = "Update user details")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity
                .ok(ApiResponse.success("User updated successfully", adminService.updateUser(id, request)));
    }

    @DeleteMapping("/users/{id}")
    @Operation(summary = "Delete a user")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }

    @GetMapping("/users")
    @Operation(summary = "Get all users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllUsers()));
    }

    @GetMapping("/users/students")
    @Operation(summary = "Get all students")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getStudents() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getUsersByRole(Role.STUDENT)));
    }

    @GetMapping("/users/organizers")
    @Operation(summary = "Get all organizers")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getOrganizers() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getUsersByRole(Role.ORGANIZER)));
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get system-wide dashboard statistics")
    public ResponseEntity<ApiResponse<DashboardStats>> getDashboardStats() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getDashboardStats()));
    }
}
