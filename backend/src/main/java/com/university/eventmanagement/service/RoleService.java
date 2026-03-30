package com.university.eventmanagement.service;

import com.university.eventmanagement.dto.AppRoleResponse;
import com.university.eventmanagement.dto.AssignRoleRequest;
import com.university.eventmanagement.dto.UserRoleResponse;
import com.university.eventmanagement.exception.BadRequestException;
import com.university.eventmanagement.exception.ResourceNotFoundException;
import com.university.eventmanagement.model.*;
import com.university.eventmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.university.eventmanagement.aspect.LogAudit;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {

        private final AppRoleRepository appRoleRepository;
        private final UserRepository userRepository;
        private final UserRoleRepository userRoleRepository;
        private final DepartmentRepository departmentRepository;
        private final ClubRepository clubRepository;

        public List<AppRoleResponse> getAllRoles() {
                return appRoleRepository.findAll().stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        /**
         * Get all role assignments for a user, including lifecycle status.
         */
        public List<UserRoleResponse> getUserRoleAssignments(Long userId) {
                return userRoleRepository.findByUserId(userId).stream()
                                .map(this::mapToUserRoleResponse)
                                .collect(Collectors.toList());
        }

        @Transactional
        @Caching(evict = {
                        @CacheEvict(value = "userPermissions", key = "#userId"),
                        @CacheEvict(value = "userPermissionsList", key = "#userId")
        })
        @LogAudit(action = "ASSIGN_ROLE", entityType = "UserRole", entityIdExpression = "#userId")
        public void assignRoleToUser(Long userId, AssignRoleRequest request) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                AppRole role = appRoleRepository.findByName(request.getRoleName())
                                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

                // Validate time range
                if (request.getValidFrom() != null && request.getValidUntil() != null) {
                        if (request.getValidUntil().isBefore(request.getValidFrom())) {
                                throw new BadRequestException("End date cannot be before start date.");
                        }
                        if (request.getValidUntil().isBefore(LocalDateTime.now())) {
                                throw new BadRequestException("Cannot assign a role that has already expired.");
                        }
                }

                Department dept = null;
                if (request.getDepartmentId() != null) {
                        dept = departmentRepository.findById(request.getDepartmentId())
                                        .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
                }

                Club club = null;
                if (request.getClubId() != null) {
                        club = clubRepository.findById(request.getClubId())
                                        .orElseThrow(() -> new ResourceNotFoundException("Club not found"));
                }

                final Department finalDept = dept;
                final Club finalClub = club;

                // Check if user already has this role in this scope
                boolean hasRole = user.getRoles().stream()
                                .anyMatch(ur -> ur.getRole().getName().equals(role.getName()) &&
                                                ur.getStatus() != RoleAssignmentStatus.REJECTED &&
                                                ur.getStatus() != RoleAssignmentStatus.EXPIRED &&
                                                (ur.getDepartment() == null || ur.getDepartment().equals(finalDept)) &&
                                                (ur.getClub() == null || ur.getClub().equals(finalClub)));
                if (hasRole) {
                        throw new BadRequestException("User already has this role in the specified scope.");
                }

                // Determine status based on requiresAcceptance flag
                RoleAssignmentStatus status = request.isRequiresAcceptance()
                                ? RoleAssignmentStatus.PENDING
                                : RoleAssignmentStatus.ACTIVE;

                UserRole userRole = UserRole.builder()
                                .user(user)
                                .role(role)
                                .department(dept)
                                .club(club)
                                .status(status)
                                .validFrom(request.getValidFrom())
                                .validUntil(request.getValidUntil())
                                .requiresAcceptance(request.isRequiresAcceptance())
                                .build();
                user.getRoles().add(userRole);
                userRepository.save(user);
        }

        /**
         * Accept a pending role invitation.
         */
        @Transactional
        @LogAudit(action = "ACCEPT_ROLE_INVITATION", entityType = "UserRole", entityIdExpression = "#userRoleId")
        public void acceptRoleInvitation(Long userId, Long userRoleId) {
                UserRole userRole = userRoleRepository.findById(userRoleId)
                                .orElseThrow(() -> new ResourceNotFoundException("Role assignment not found"));

                if (!userRole.getUser().getId().equals(userId)) {
                        throw new BadRequestException("This invitation does not belong to you.");
                }
                if (userRole.getStatus() != RoleAssignmentStatus.PENDING) {
                        throw new BadRequestException("This invitation is no longer pending.");
                }

                // Check if invitation has expired by time
                if (userRole.getValidUntil() != null && userRole.getValidUntil().isBefore(LocalDateTime.now())) {
                        userRole.setStatus(RoleAssignmentStatus.EXPIRED);
                        userRoleRepository.save(userRole);
                        throw new BadRequestException("This invitation has expired.");
                }

                userRole.setStatus(RoleAssignmentStatus.ACTIVE);
                userRoleRepository.save(userRole);
        }

        /**
         * Reject a pending role invitation.
         */
        @Transactional
        @LogAudit(action = "REJECT_ROLE_INVITATION", entityType = "UserRole", entityIdExpression = "#userRoleId")
        public void rejectRoleInvitation(Long userId, Long userRoleId) {
                UserRole userRole = userRoleRepository.findById(userRoleId)
                                .orElseThrow(() -> new ResourceNotFoundException("Role assignment not found"));

                if (!userRole.getUser().getId().equals(userId)) {
                        throw new BadRequestException("This invitation does not belong to you.");
                }
                if (userRole.getStatus() != RoleAssignmentStatus.PENDING) {
                        throw new BadRequestException("This invitation is no longer pending.");
                }

                userRole.setStatus(RoleAssignmentStatus.REJECTED);
                userRoleRepository.save(userRole);
        }

        @Transactional
        @Caching(evict = {
                        @CacheEvict(value = "userPermissions", key = "#userId"),
                        @CacheEvict(value = "userPermissionsList", key = "#userId")
        })
        public void removeRoleFromUser(Long userId, String roleName) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                user.getRoles().removeIf(ur -> ur.getRole().getName().equals(roleName));
                userRepository.save(user);
        }

        private AppRoleResponse mapToResponse(AppRole role) {
                Set<String> perms = role.getPermissions().stream()
                                .map(Permission::getName)
                                .collect(Collectors.toSet());

                return AppRoleResponse.builder()
                                .id(role.getId())
                                .name(role.getName())
                                .scope(role.getScope() != null ? role.getScope().name() : null)
                                .permissions(perms)
                                .build();
        }

        private UserRoleResponse mapToUserRoleResponse(UserRole ur) {
                String assignedByName = null;
                if (ur.getAssignedBy() != null) {
                        assignedByName = userRepository.findById(ur.getAssignedBy())
                                        .map(User::getFullName)
                                        .orElse(null);
                }

                return UserRoleResponse.builder()
                                .id(ur.getId())
                                .roleName(ur.getRole().getName())
                                .status(ur.getStatus().name())
                                .departmentName(ur.getDepartment() != null ? ur.getDepartment().getName() : null)
                                .clubName(ur.getClub() != null ? ur.getClub().getName() : null)
                                .validFrom(ur.getValidFrom())
                                .validUntil(ur.getValidUntil())
                                .requiresAcceptance(ur.isRequiresAcceptance())
                                .assignedByName(assignedByName)
                                .assignedAt(ur.getAssignedAt())
                                .build();
        }
}
