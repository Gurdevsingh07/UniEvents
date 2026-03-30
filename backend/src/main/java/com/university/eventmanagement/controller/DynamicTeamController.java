package com.university.eventmanagement.controller;

import com.university.eventmanagement.dto.*;
import com.university.eventmanagement.security.RequiresPermission;
import com.university.eventmanagement.service.DynamicTeamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
@Tag(name = "Dynamic Teams", description = "Management of dynamically created teams for events")
public class DynamicTeamController {

    private final DynamicTeamService dynamicTeamService;

    @PostMapping
    @RequiresPermission("MANAGE_MEMBERS")
    @Operation(summary = "Create a new dynamic team")
    public ResponseEntity<ApiResponse<TeamResponse>> createTeam(@Valid @RequestBody CreateTeamRequest request) {
        return ResponseEntity.ok(ApiResponse.success(dynamicTeamService.createTeam(request)));
    }

    @PutMapping("/{id}")
    @RequiresPermission("MANAGE_MEMBERS")
    @Operation(summary = "Update an existing dynamic team")
    public ResponseEntity<ApiResponse<TeamResponse>> updateTeam(
            @PathVariable Long id,
            @Valid @RequestBody CreateTeamRequest request) {
        return ResponseEntity.ok(ApiResponse.success(dynamicTeamService.updateTeam(id, request)));
    }

    @DeleteMapping("/{id}")
    @RequiresPermission("MANAGE_MEMBERS")
    @Operation(summary = "Delete an existing dynamic team")
    public ResponseEntity<ApiResponse<Void>> deleteTeam(@PathVariable Long id) {
        dynamicTeamService.deleteTeam(id);
        return ResponseEntity.ok(ApiResponse.success("Team deleted successfully", null));
    }

    @GetMapping("/my-teams")
    @Operation(summary = "Get all teams created by or joined by the current user")
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getMyTeams() {
        return ResponseEntity.ok(ApiResponse.success(dynamicTeamService.getMyTeams()));
    }

    @PostMapping("/{teamId}/members")
    @RequiresPermission("MANAGE_MEMBERS")
    @Operation(summary = "Add a student to the dynamic team and grant permissions")
    public ResponseEntity<ApiResponse<DynamicTeamMemberResponse>> addTeamMember(
            @PathVariable Long teamId,
            @Valid @RequestBody AddTeamMemberRequest request) {
        return ResponseEntity.ok(ApiResponse.success(dynamicTeamService.addTeamMember(teamId, request)));
    }

    @PutMapping("/{teamId}/members/{memberId}")
    @RequiresPermission("MANAGE_MEMBERS")
    @Operation(summary = "Update an existing team member's position and permissions")
    public ResponseEntity<ApiResponse<DynamicTeamMemberResponse>> updateTeamMember(
            @PathVariable Long teamId,
            @PathVariable Long memberId,
            @Valid @RequestBody UpdateTeamMemberRequest request) {
        return ResponseEntity.ok(ApiResponse.success(dynamicTeamService.updateTeamMember(teamId, memberId, request)));
    }

    @DeleteMapping("/{teamId}/members/{memberId}")
    @RequiresPermission("MANAGE_MEMBERS")
    @Operation(summary = "Remove a member from the team")
    public ResponseEntity<ApiResponse<Void>> removeTeamMember(
            @PathVariable Long teamId,
            @PathVariable Long memberId) {
        dynamicTeamService.removeTeamMember(teamId, memberId);
        return ResponseEntity.ok(ApiResponse.success("Team member removed successfully", null));
    }

    @GetMapping("/{teamId}/members")
    @Operation(summary = "Get all members of the team")
    public ResponseEntity<ApiResponse<List<DynamicTeamMemberResponse>>> getTeamMembers(
            @PathVariable Long teamId) {
        return ResponseEntity.ok(ApiResponse.success(dynamicTeamService.getTeamMembers(teamId)));
    }
}
