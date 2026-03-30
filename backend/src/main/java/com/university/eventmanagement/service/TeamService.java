package com.university.eventmanagement.service;

import com.university.eventmanagement.dto.AssignRoleRequest;
import com.university.eventmanagement.dto.AppRoleResponse;
import com.university.eventmanagement.dto.TeamMemberResponse;
import com.university.eventmanagement.exception.BadRequestException;
import com.university.eventmanagement.exception.ResourceNotFoundException;
import com.university.eventmanagement.model.*;
import com.university.eventmanagement.repository.*;
import com.university.eventmanagement.aspect.LogAudit;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamService {

        private final UserRepository userRepository;
        private final AppRoleRepository appRoleRepository;
        private final UserRoleRepository userRoleRepository;
        private final DepartmentRepository departmentRepository;
        private final ClubRepository clubRepository;
        private final NotificationService notificationService;

        /**
         * Get scoped members visible to an organizer.
         * Only returns users in the organizer's department, excluding anyone
         * who holds a UNIVERSITY-scoped role (admins).
         */
        public List<TeamMemberResponse> getScopedMembers(Long organizerId, String filter, String search) {
                User organizer = userRepository.findById(organizerId)
                                .orElseThrow(() -> new ResourceNotFoundException("Organizer not found"));

                int organizerMaxScope = getMaxScopeLevel(organizer);
                List<User> users;

                if (organizerMaxScope >= RoleScope.UNIVERSITY.getLevel()) {
                        if (search != null && !search.isBlank()) {
                                users = userRepository.searchAllExcludingUniversityScope(search.trim());
                        } else {
                                users = userRepository.findAllExcludingUniversityScope();
                        }
                } else {
                        if (organizer.getDepartment() == null) {
                                throw new BadRequestException("Organizer has no department assignment.");
                        }
                        Long deptId = organizer.getDepartment().getId();
                        if (search != null && !search.isBlank()) {
                                users = userRepository.searchByDepartmentScope(deptId, search.trim());
                        } else {
                                users = userRepository.findByDepartmentExcludingUniversityScope(deptId);
                        }
                }

                // Optional role filter
                if (filter != null && !filter.isBlank() && !filter.equalsIgnoreCase("all")) {
                        users = users.stream()
                                        .filter(u -> u.getRoles().stream()
                                                        .anyMatch(ur -> ur.getRole().getName()
                                                                        .equalsIgnoreCase(filter)))
                                        .collect(Collectors.toList());
                }

                // Exclude self from the list
                users = users.stream()
                                .filter(u -> !Objects.equals(u.getId(), organizerId))
                                .collect(Collectors.toList());

                return users.stream().map(u -> mapToTeamMember(u, organizer)).collect(Collectors.toList());
        }

        /**
         * Assign a scoped role with strict hierarchy enforcement.
         * Validates: (1) not self-assigning, (2) target is in scope,
         * (3) target role scope < organizer scope, (4) no ADMIN/ORGANIZER assignment,
         * (5) target doesn't already have this active role, (6) time range valid.
         */
        @Transactional
        @Caching(evict = {
                        @CacheEvict(value = "userPermissions", key = "#targetUserId"),
                        @CacheEvict(value = "userPermissionsList", key = "#targetUserId")
        })
        @LogAudit(action = "ASSIGN_SCOPED_ROLE", entityType = "UserRole", entityIdExpression = "#targetUserId")
        public void assignScopedRole(Long organizerId, Long targetUserId, AssignRoleRequest request) {
                // 1️⃣ Self-assignment block
                if (Objects.equals(organizerId, targetUserId)) {
                        throw new BadRequestException("You cannot assign roles to yourself.");
                }

                User organizer = userRepository.findById(organizerId)
                                .orElseThrow(() -> new ResourceNotFoundException("Organizer not found"));
                User target = userRepository.findById(targetUserId)
                                .orElseThrow(() -> new ResourceNotFoundException("Target user not found"));

                // 2️⃣ Scope check — cross-department allowed ONLY IF organizer has UNIVERSITY
                // scope
                int organizerMaxScope = getMaxScopeLevel(organizer);

                if (organizerMaxScope < RoleScope.UNIVERSITY.getLevel()) {
                        if (organizer.getDepartment() == null || target.getDepartment() == null
                                        || !Objects.equals(organizer.getDepartment().getId(),
                                                        target.getDepartment().getId())) {
                                throw new BadRequestException("Target user is not in your department.");
                        }
                }

                // 3️⃣ Check target is not an admin/university-scoped role holder (defense in
                // depth)
                boolean targetHasUniversityRole = target.getRoles().stream()
                                .anyMatch(ur -> ur.getRole().getScope() == RoleScope.UNIVERSITY);
                if (targetHasUniversityRole) {
                        throw new BadRequestException("Cannot modify roles for this user.");
                }

                // 4️⃣ Resolve the target role
                AppRole targetRole = appRoleRepository.findByName(request.getRoleName())
                                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

                // 5️⃣ Blacklist: cannot assign ADMIN or ORGANIZER
                if ("ADMIN".equals(targetRole.getName()) || "ORGANIZER".equals(targetRole.getName())) {
                        throw new BadRequestException("You do not have authority to assign this role.");
                }

                // 6️⃣ Hierarchy check: target role scope must be STRICTLY LESS than organizer's
                // max scope
                if (targetRole.getScope().getLevel() >= organizerMaxScope) {
                        throw new BadRequestException("You cannot assign roles at or above your scope level.");
                }

                // 7️⃣ Time range validation
                if (request.getValidFrom() != null && request.getValidUntil() != null) {
                        if (request.getValidUntil().isBefore(request.getValidFrom())) {
                                throw new BadRequestException("End date cannot be before start date.");
                        }
                        if (request.getValidUntil().isBefore(LocalDateTime.now())) {
                                throw new BadRequestException("Cannot assign a role that has already expired.");
                        }
                }

                // 8️⃣ Duplicate active role check
                Department dept = organizer.getDepartment();
                Club club = null;
                if (request.getClubId() != null) {
                        club = clubRepository.findById(request.getClubId())
                                        .orElseThrow(() -> new ResourceNotFoundException("Club not found"));
                }

                final Department fDept = dept;
                final Club fClub = club;
                boolean hasActiveRole = target.getRoles().stream()
                                .anyMatch(ur -> ur.getRole().getName().equals(targetRole.getName())
                                                && ur.getStatus() != RoleAssignmentStatus.REJECTED
                                                && ur.getStatus() != RoleAssignmentStatus.EXPIRED
                                                && Objects.equals(
                                                                ur.getDepartment() != null ? ur.getDepartment().getId()
                                                                                : null,
                                                                fDept != null ? fDept.getId() : null)
                                                && Objects.equals(
                                                                ur.getClub() != null ? ur.getClub().getId() : null,
                                                                fClub != null ? fClub.getId() : null));
                if (hasActiveRole) {
                        throw new BadRequestException("User already has this role in the specified scope.");
                }

                // 9️⃣ Build and persist
                RoleAssignmentStatus status = request.isRequiresAcceptance()
                                ? RoleAssignmentStatus.PENDING
                                : RoleAssignmentStatus.ACTIVE;

                UserRole userRole = UserRole.builder()
                                .user(target)
                                .role(targetRole)
                                .department(dept)
                                .club(club)
                                .status(status)
                                .validFrom(request.getValidFrom())
                                .validUntil(request.getValidUntil())
                                .requiresAcceptance(request.isRequiresAcceptance())
                                .assignedBy(organizerId)
                                .build();

                target.getRoles().add(userRole);
                userRepository.save(target);

                // Send Notification (Feature 6.4)
                notificationService.sendNotification(target, "ROLE_ASSIGNED",
                                "You have been assigned the role: " + targetRole.getName() + " by "
                                                + organizer.getFullName(),
                                null);
        }

        /**
         * Get roles the organizer is allowed to assign (scope < organizer scope,
         * excluding ADMIN and ORGANIZER).
         */
        public List<AppRoleResponse> getAssignableRoles(Long organizerId) {
                User organizer = userRepository.findById(organizerId)
                                .orElseThrow(() -> new ResourceNotFoundException("Organizer not found"));

                int maxScope = getMaxScopeLevel(organizer);

                return appRoleRepository.findAll().stream()
                                .filter(r -> r.getScope().getLevel() < maxScope)
                                .filter(r -> !"ADMIN".equals(r.getName()) && !"ORGANIZER".equals(r.getName()))
                                .map(r -> AppRoleResponse.builder()
                                                .id(r.getId())
                                                .name(r.getName())
                                                .scope(r.getScope().name())
                                                .build())
                                .collect(Collectors.toList());
        }

        private int getMaxScopeLevel(User user) {
                return user.getRoles().stream()
                                .filter(ur -> ur.getStatus() == RoleAssignmentStatus.ACTIVE || ur.getStatus() == null)
                                .mapToInt(ur -> ur.getRole().getScope().getLevel())
                                .max()
                                .orElse(0);
        }

        private TeamMemberResponse mapToTeamMember(User user, User organizer) {
                List<String> roleNames = user.getRoles().stream()
                                .filter(ur -> ur.getStatus() == RoleAssignmentStatus.ACTIVE || ur.getStatus() == null)
                                .map(ur -> ur.getRole().getName())
                                .collect(Collectors.toList());

                // Read-only if target is an organizer (same scope level = cannot modify)
                boolean isReadOnly = user.getRoles().stream()
                                .anyMatch(ur -> "ORGANIZER".equals(ur.getRole().getName()));

                return TeamMemberResponse.builder()
                                .id(user.getId())
                                .fullName(user.getFullName())
                                .email(user.getEmail())
                                .studentId(user.getStudentId())
                                .department(user.getDepartment() != null ? user.getDepartment().getName() : null)
                                .roles(roleNames)
                                .status(user.getStatus() != null ? user.getStatus().name() : "ACTIVE")
                                .readOnly(isReadOnly)
                                .build();
        }
}
