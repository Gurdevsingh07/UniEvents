package com.university.eventmanagement.service;

import com.university.eventmanagement.dto.*;
import com.university.eventmanagement.exception.BadRequestException;
import com.university.eventmanagement.exception.ResourceNotFoundException;
import com.university.eventmanagement.exception.UnauthorizedException;
import com.university.eventmanagement.model.*;
import com.university.eventmanagement.repository.TeamRepository;
import com.university.eventmanagement.repository.TeamMemberRepository;
import com.university.eventmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class DynamicTeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final PermissionService permissionService;
    private final RoleService roleService;

    public TeamResponse createTeam(CreateTeamRequest request) {
        User currentUser = authService.getCurrentUser();

        Team team = Team.builder()
                .name(request.getName())
                .description(request.getDescription())
                .purpose(request.getPurpose())
                .createdBy(currentUser)
                .build();

        Team savedTeam = teamRepository.save(team);
        return mapToTeamResponse(savedTeam);
    }

    public TeamResponse updateTeam(Long id, CreateTeamRequest request) {
        Team team = getTeamAndVerifyOwnership(id);

        team.setName(request.getName());
        team.setDescription(request.getDescription());
        team.setPurpose(request.getPurpose());

        Team savedTeam = teamRepository.save(team);
        return mapToTeamResponse(savedTeam);
    }

    public void deleteTeam(Long id) {
        Team team = getTeamAndVerifyOwnership(id);

        // Evict cache for all members before deletion
        List<TeamMember> members = teamMemberRepository.findByTeamIdAndIsActiveTrue(team.getId());
        for (TeamMember member : members) {
            permissionService.clearCache(member.getUser().getId());
        }

        teamMemberRepository.deleteByTeamId(team.getId());
        teamRepository.delete(team);
    }

    @Transactional(readOnly = true)
    public List<TeamResponse> getMyTeams() {
        User currentUser = authService.getCurrentUser();
        if (currentUser == null)
            return new java.util.ArrayList<>();

        java.util.List<TeamResponse> allTeams = new java.util.ArrayList<>();
        java.util.Set<Long> addedTeamIds = new java.util.HashSet<>();

        // 1. Teams where user is a member
        List<TeamMember> memberships = teamMemberRepository.findByUserIdAndIsActiveTrue(currentUser.getId());
        for (TeamMember member : memberships) {
            if (member.getTeam() != null && member.getTeam().isActive()) {
                TeamResponse tr = mapToTeamResponse(member.getTeam(), member.getPosition());
                if (tr != null) {
                    allTeams.add(tr);
                    addedTeamIds.add(tr.getId());
                }
            }
        }

        // 2. Teams created by the user (if not already added as member)
        List<Team> createdTeams = teamRepository.findByCreatedByAndIsActiveTrue(currentUser);
        for (Team team : createdTeams) {
            if (!addedTeamIds.contains(team.getId())) {
                TeamResponse tr = mapToTeamResponse(team, "Creator");
                if (tr != null) {
                    allTeams.add(tr);
                    addedTeamIds.add(tr.getId());
                }
            }
        }

        return allTeams;
    }

    public DynamicTeamMemberResponse addTeamMember(Long teamId, AddTeamMemberRequest request) {
        Team team = getTeamAndVerifyOwnership(teamId);

        User targetUser = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

        Optional<TeamMember> existingMember = teamMemberRepository.findByTeamIdAndUserIdAndIsActiveTrue(teamId,
                targetUser.getId());
        if (existingMember.isPresent()) {
            throw new BadRequestException("User is already a member of this team");
        }

        User currentUser = authService.getCurrentUser();

        // Save the member first (without permission) to get a generated ID
        TeamMember teamMember = TeamMember.builder()
                .team(team)
                .user(targetUser)
                .position(request.getPosition())
                .assignedBy(currentUser)
                .build();

        TeamMember savedMember = teamMemberRepository.save(teamMember);

        // Now create permission with the backref so @MapsId can derive the ID
        TeamMemberPermission permission = TeamMemberPermission.builder()
                .teamMember(savedMember)
                .canScanAttendance(request.isCanScanAttendance())
                .canViewAttendanceSheet(request.isCanViewAttendanceSheet())
                .canManualOverride(request.isCanManualOverride())
                .canViewLiveStats(request.isCanViewLiveStats())
                .canManageTeam(request.isCanManageTeam())
                .canManageEvent(request.isCanManageEvent())
                .build();

        savedMember.setPermission(permission);
        savedMember = teamMemberRepository.save(savedMember);

        // Auto-assign VOLUNTEER UserRole to sync Profile status if not present
        boolean hasVolunteer = targetUser.getRoles().stream()
                .anyMatch(ur -> ur.getRole().getName().equals("VOLUNTEER")
                        && ur.getStatus() != RoleAssignmentStatus.EXPIRED
                        && ur.getStatus() != RoleAssignmentStatus.REJECTED);

        if (!hasVolunteer) {
            try {
                AssignRoleRequest roleReq = new AssignRoleRequest();
                roleReq.setRoleName("VOLUNTEER");
                roleReq.setRequiresAcceptance(false); // Pre-approved field assignment
                if (team.getCreatedBy() != null && team.getCreatedBy().getDepartment() != null) {
                    roleReq.setDepartmentId(team.getCreatedBy().getDepartment().getId());
                }
                roleService.assignRoleToUser(targetUser.getId(), roleReq);
            } catch (Exception e) {
                log.error("Failed to auto-assign VOLUNTEER role during team addition", e);
            }
        }

        // Evict permission cache so the user gets the new permissions immediately
        permissionService.clearCache(targetUser.getId());

        return mapToTeamMemberResponse(savedMember);
    }

    public DynamicTeamMemberResponse updateTeamMember(Long teamId, Long memberId, UpdateTeamMemberRequest request) {
        Team team = getTeamAndVerifyOwnership(teamId);

        TeamMember member = teamMemberRepository.findByIdAndIsActiveTrue(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Team member not found"));

        if (!member.getTeam().getId().equals(team.getId())) {
            throw new BadRequestException("Member does not belong to this team");
        }

        member.setPosition(request.getPosition());

        if (member.getPermission() == null) {
            member.setPermission(new TeamMemberPermission());
        }

        TeamMemberPermission perm = member.getPermission();
        perm.setCanScanAttendance(request.isCanScanAttendance());
        perm.setCanViewAttendanceSheet(request.isCanViewAttendanceSheet());
        perm.setCanManualOverride(request.isCanManualOverride());
        perm.setCanViewLiveStats(request.isCanViewLiveStats());
        perm.setCanManageTeam(request.isCanManageTeam());
        perm.setCanManageEvent(request.isCanManageEvent());

        TeamMember savedMember = teamMemberRepository.save(member);

        // Evict permission cache
        permissionService.clearCache(member.getUser().getId());

        return mapToTeamMemberResponse(savedMember);
    }

    public void removeTeamMember(Long teamId, Long memberId) {
        Team team = getTeamAndVerifyOwnership(teamId);

        TeamMember member = teamMemberRepository.findByIdAndIsActiveTrue(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Team member not found"));

        if (!member.getTeam().getId().equals(team.getId())) {
            throw new BadRequestException("Member does not belong to this team");
        }

        Long userId = member.getUser().getId();

        // Auto-revoke VOLUNTEER UserRole if this is their last active team membership
        List<TeamMember> activememberships = teamMemberRepository.findByUserIdAndIsActiveTrue(userId);
        if (activememberships.size() <= 1) {
            try {
                roleService.removeRoleFromUser(userId, "VOLUNTEER");
            } catch (Exception e) {
                log.error("Failed to auto-revoke VOLUNTEER role during team removal", e);
            }
        }

        teamMemberRepository.delete(member);

        // Evict permission cache
        permissionService.clearCache(userId);
    }

    @Transactional(readOnly = true)
    public List<DynamicTeamMemberResponse> getTeamMembers(Long teamId) {
        Team team = teamRepository.findByIdAndIsActiveTrue(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + teamId));

        User currentUser = authService.getCurrentUser();

        // Allow if the user is the team owner (organizer who created it)
        boolean isOwner = "ADMIN".equals(currentUser.getPrimaryRoleName()) ||
                (team.getCreatedBy() != null && team.getCreatedBy().getId().equals(currentUser.getId()));

        // Or allow if the user is an active member of the team (organizer granted them
        // access)
        boolean isMember = teamMemberRepository
                .findByTeamIdAndUserIdAndIsActiveTrue(teamId, currentUser.getId())
                .isPresent();

        if (!isOwner && !isMember) {
            throw new com.university.eventmanagement.exception.UnauthorizedException(
                    "You do not have permission to view this team's members");
        }

        List<TeamMember> members = teamMemberRepository.findByTeamIdAndIsActiveTrue(team.getId());
        return members.stream().map(this::mapToTeamMemberResponse).collect(Collectors.toList());
    }

    private Team getTeamAndVerifyOwnership(Long teamId) {
        Team team = teamRepository.findByIdAndIsActiveTrue(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + teamId));

        User currentUser = authService.getCurrentUser();
        // Allow Admins to bypass? Based on spec, Organizer owns the team.
        if (!currentUser.getPrimaryRoleName().equals("ADMIN") &&
                (team.getCreatedBy() == null || !team.getCreatedBy().getId().equals(currentUser.getId()))) {
            throw new UnauthorizedException("You do not have permission to manage this team");
        }
        return team;
    }

    private TeamResponse mapToTeamResponse(Team team, String position) {
        if (team == null)
            return null;
        UserBasicDTO createdByDto = null;
        if (team.getCreatedBy() != null) {
            createdByDto = new UserBasicDTO();
            createdByDto.setId(team.getCreatedBy().getId());
            createdByDto.setFullName(team.getCreatedBy().getFullName());
            createdByDto.setEmail(team.getCreatedBy().getEmail());
        }

        return TeamResponse.builder()
                .id(team.getId())
                .name(team.getName())
                .description(team.getDescription())
                .purpose(team.getPurpose())
                .createdBy(createdByDto)
                .createdAt(team.getCreatedAt() != null ? team.getCreatedAt().toString() : null)
                .position(position)
                .build();
    }

    private TeamResponse mapToTeamResponse(Team team) {
        return mapToTeamResponse(team, null);
    }

    private DynamicTeamMemberResponse mapToTeamMemberResponse(TeamMember member) {
        UserBasicDTO userDto = new UserBasicDTO();
        if (member.getUser() != null) {
            userDto.setId(member.getUser().getId());
            userDto.setFullName(member.getUser().getFullName());
            userDto.setEmail(member.getUser().getEmail());
        }

        TeamMemberPermission perm = member.getPermission();
        boolean canScanAttendance = perm != null && perm.isCanScanAttendance();
        boolean canViewAttendanceSheet = perm != null && perm.isCanViewAttendanceSheet();
        boolean canManualOverride = perm != null && perm.isCanManualOverride();
        boolean canViewLiveStats = perm != null && perm.isCanViewLiveStats();
        boolean canManageTeam = perm != null && perm.isCanManageTeam();
        boolean canManageEvent = perm != null && perm.isCanManageEvent();

        return DynamicTeamMemberResponse.builder()
                .id(member.getId())
                .user(userDto)
                .position(member.getPosition())
                .canScanAttendance(canScanAttendance)
                .canViewAttendanceSheet(canViewAttendanceSheet)
                .canManualOverride(canManualOverride)
                .canViewLiveStats(canViewLiveStats)
                .canManageTeam(canManageTeam)
                .canManageEvent(canManageEvent)
                .joinedAt(member.getAssignedAt() != null ? member.getAssignedAt().toString() : null)
                .build();
    }
}
