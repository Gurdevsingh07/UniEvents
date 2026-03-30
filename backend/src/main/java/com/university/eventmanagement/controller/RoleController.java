package com.university.eventmanagement.controller;

import com.university.eventmanagement.dto.ApiResponse;
import com.university.eventmanagement.dto.AppRoleResponse;
import com.university.eventmanagement.dto.AssignRoleRequest;
import com.university.eventmanagement.dto.UserRoleResponse;
import com.university.eventmanagement.security.RequiresPermission;
import com.university.eventmanagement.service.RoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
@Tag(name = "Roles", description = "Role management and invitation endpoints")
public class RoleController {

    private final RoleService roleService;
    private final com.university.eventmanagement.repository.UserRepository userRepository;

    @GetMapping
    @RequiresPermission("MANAGE_USERS")
    @Operation(summary = "Get all available roles")
    public ResponseEntity<ApiResponse<List<AppRoleResponse>>> getAllRoles() {
        return ResponseEntity.ok(ApiResponse.success(roleService.getAllRoles()));
    }

    @GetMapping("/my-roles")
    @Operation(summary = "Get current user's role assignments with lifecycle status")
    public ResponseEntity<ApiResponse<List<UserRoleResponse>>> getMyRoles(Authentication auth) {
        Long userId = userRepository.findByEmail(auth.getName())
                .orElseThrow(
                        () -> new com.university.eventmanagement.exception.ResourceNotFoundException("User not found"))
                .getId();
        return ResponseEntity.ok(ApiResponse.success(roleService.getUserRoleAssignments(userId)));
    }

    @PostMapping("/users/{userId}/assign")
    @RequiresPermission("MANAGE_USERS")
    @Operation(summary = "Assign a role to a user")
    public ResponseEntity<ApiResponse<Void>> assignRole(
            @PathVariable Long userId,
            @Valid @RequestBody AssignRoleRequest request) {
        roleService.assignRoleToUser(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Role has been assigned.", null));
    }

    @PostMapping("/invitations/{id}/accept")
    @Operation(summary = "Accept a pending role invitation")
    public ResponseEntity<ApiResponse<Void>> acceptInvitation(
            @PathVariable Long id,
            Authentication auth) {
        Long userId = userRepository.findByEmail(auth.getName())
                .orElseThrow(
                        () -> new com.university.eventmanagement.exception.ResourceNotFoundException("User not found"))
                .getId();
        roleService.acceptRoleInvitation(userId, id);
        return ResponseEntity.ok(ApiResponse.success("You have accepted the role invitation.", null));
    }

    @PostMapping("/invitations/{id}/reject")
    @Operation(summary = "Decline a pending role invitation")
    public ResponseEntity<ApiResponse<Void>> rejectInvitation(
            @PathVariable Long id,
            Authentication auth) {
        Long userId = userRepository.findByEmail(auth.getName())
                .orElseThrow(
                        () -> new com.university.eventmanagement.exception.ResourceNotFoundException("User not found"))
                .getId();
        roleService.rejectRoleInvitation(userId, id);
        return ResponseEntity.ok(ApiResponse.success("You have declined the role invitation.", null));
    }

    @DeleteMapping("/users/{userId}/remove/{roleName}")
    @RequiresPermission("MANAGE_USERS")
    @Operation(summary = "Remove a role from a user")
    public ResponseEntity<ApiResponse<Void>> removeRole(
            @PathVariable Long userId,
            @PathVariable String roleName) {
        roleService.removeRoleFromUser(userId, roleName);
        return ResponseEntity.ok(ApiResponse.success("Role has been removed.", null));
    }
}
