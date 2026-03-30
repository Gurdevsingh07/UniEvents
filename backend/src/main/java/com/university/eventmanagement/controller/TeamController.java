package com.university.eventmanagement.controller;

import com.university.eventmanagement.dto.ApiResponse;
import com.university.eventmanagement.dto.AppRoleResponse;
import com.university.eventmanagement.dto.AssignRoleRequest;
import com.university.eventmanagement.dto.TeamMemberResponse;
import com.university.eventmanagement.security.RequiresPermission;
import com.university.eventmanagement.service.TeamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/team")
@RequiredArgsConstructor
@Tag(name = "Team Management", description = "Scoped member management for organizers")
public class TeamController {

        private final TeamService teamService;
        private final com.university.eventmanagement.repository.UserRepository userRepository;

        @GetMapping("/members")
        @Operation(summary = "Get department members visible to this organizer")
        public ResponseEntity<ApiResponse<List<TeamMemberResponse>>> getMembers(
                        Authentication auth,
                        @RequestParam(required = false) String filter,
                        @RequestParam(required = false) String search) {
                Long organizerId = userRepository.findByEmail(auth.getName())
                                .orElseThrow(
                                                () -> new com.university.eventmanagement.exception.ResourceNotFoundException(
                                                                "User not found"))
                                .getId();
                return ResponseEntity
                                .ok(ApiResponse.success(teamService.getScopedMembers(organizerId, filter, search)));
        }

        @PostMapping("/members/{userId}/assign-role")
        @RequiresPermission("MANAGE_MEMBERS")
        @Operation(summary = "Assign a scoped role to a team member")
        public ResponseEntity<ApiResponse<Void>> assignRole(
                        Authentication auth,
                        @PathVariable Long userId,
                        @Valid @RequestBody AssignRoleRequest request) {
                Long organizerId = userRepository.findByEmail(auth.getName())
                                .orElseThrow(
                                                () -> new com.university.eventmanagement.exception.ResourceNotFoundException(
                                                                "User not found"))
                                .getId();
                teamService.assignScopedRole(organizerId, userId, request);
                return ResponseEntity.ok(ApiResponse.success("Role has been assigned.", null));
        }

        @GetMapping("/assignable-roles")
        @RequiresPermission("MANAGE_MEMBERS")
        @Operation(summary = "Get roles this organizer is allowed to assign")
        public ResponseEntity<ApiResponse<List<AppRoleResponse>>> getAssignableRoles(Authentication auth) {
                Long organizerId = userRepository.findByEmail(auth.getName())
                                .orElseThrow(
                                                () -> new com.university.eventmanagement.exception.ResourceNotFoundException(
                                                                "User not found"))
                                .getId();
                return ResponseEntity.ok(ApiResponse.success(teamService.getAssignableRoles(organizerId)));
        }
}
