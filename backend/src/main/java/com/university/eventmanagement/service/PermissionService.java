package com.university.eventmanagement.service;

import com.university.eventmanagement.model.Permission;
import com.university.eventmanagement.model.UserRole;
import com.university.eventmanagement.repository.TeamMemberRepository;
import com.university.eventmanagement.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PermissionService {

    private final UserRoleRepository userRoleRepository;
    private final TeamMemberRepository teamMemberRepository;

    /**
     * Check if user has a specific permission.
     * Only considers ACTIVE roles within their valid time window.
     */
    @Cacheable(value = "userPermissions", key = "{#userId, #permissionName}")
    public boolean hasPermission(Long userId, String permissionName) {
        // First check role-based permissions
        List<UserRole> roles = userRoleRepository.findActiveRolesInTimeWindow(userId, LocalDateTime.now());
        for (UserRole ur : roles) {
            for (Permission p : ur.getRole().getPermissions()) {
                if (p.getName().equals(permissionName)) {
                    return true;
                }
            }
        }

        // Then check if it's a team-derived permission
        if (permissionName.equals("ACCESS_VOLUNTEER_PANEL") ||
                permissionName.equals("MANAGE_EVENTS") ||
                permissionName.equals("VIEW_REPORTS")) {

            List<com.university.eventmanagement.model.TeamMember> activeTeams = teamMemberRepository
                    .findByUserIdAndIsActiveTrue(userId);

            if (activeTeams.isEmpty())
                return false;
            if (permissionName.equals("ACCESS_VOLUNTEER_PANEL")) {
                return true;
            }

            for (com.university.eventmanagement.model.TeamMember tm : activeTeams) {
                if (tm.getPermission() != null) {
                    if (permissionName.equals("MANAGE_EVENTS") && tm.getPermission().isCanManageEvent()) {
                        return true;
                    }
                    if (permissionName.equals("VIEW_REPORTS") &&
                            (tm.getPermission().isCanViewAttendanceSheet()
                                    || tm.getPermission().isCanViewLiveStats())) {
                        return true;
                    }
                } else {
                    // Team member in team {} has no assigned permissions
                }
            }
        }

        return false;
    }

    /**
     * Get all permissions for a user.
     * Only considers ACTIVE roles within their valid time window.
     */
    @Cacheable(value = "userPermissionsList", key = "#userId")
    public List<String> getUserPermissions(Long userId) {
        List<String> permissions = new ArrayList<>(
                userRoleRepository.findActiveRolesInTimeWindow(userId, LocalDateTime.now()).stream()
                        .flatMap(ur -> ur.getRole().getPermissions().stream())
                        .map(Permission::getName)
                        .distinct()
                        .collect(java.util.stream.Collectors.toList()));

        // Add dynamic team-derived permissions
        List<com.university.eventmanagement.model.TeamMember> activeTeams = teamMemberRepository
                .findByUserIdAndIsActiveTrue(userId);
        if (!activeTeams.isEmpty()) {
            if (!permissions.contains("ACCESS_VOLUNTEER_PANEL")) {
                permissions.add("ACCESS_VOLUNTEER_PANEL");
            }

            for (com.university.eventmanagement.model.TeamMember tm : activeTeams) {
                if (tm.getPermission() != null) {
                    if (tm.getPermission().isCanScanAttendance() && !permissions.contains("canScanAttendance"))
                        permissions.add("canScanAttendance");
                    if (tm.getPermission().isCanViewAttendanceSheet()
                            && !permissions.contains("canViewAttendanceSheet"))
                        permissions.add("canViewAttendanceSheet");
                    if (tm.getPermission().isCanManualOverride() && !permissions.contains("canManualOverride"))
                        permissions.add("canManualOverride");
                    if (tm.getPermission().isCanViewLiveStats() && !permissions.contains("canViewLiveStats"))
                        permissions.add("canViewLiveStats");
                    if (tm.getPermission().isCanManageTeam() && !permissions.contains("canManageTeam"))
                        permissions.add("canManageTeam");
                    if (tm.getPermission().isCanManageEvent() && !permissions.contains("canManageEvent"))
                        permissions.add("canManageEvent");
                }
            }
        }

        return permissions;
    }

    /**
     * Clear the permission cache for a user.
     * Should be called when roles or team memberships change.
     */
    @Caching(evict = {
            @CacheEvict(value = "userPermissions", allEntries = true),
            @CacheEvict(value = "userPermissionsList", key = "#userId")
    })
    public void clearCache(Long userId) {
        // Method body empty, handled by @CacheEvict
    }
}
