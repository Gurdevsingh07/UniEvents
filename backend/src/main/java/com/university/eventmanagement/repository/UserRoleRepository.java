package com.university.eventmanagement.repository;

import com.university.eventmanagement.model.RoleAssignmentStatus;
import com.university.eventmanagement.model.User;
import com.university.eventmanagement.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Long> {
    List<UserRole> findByUserId(Long userId);

    List<UserRole> findByRoleName(String roleName);

    List<UserRole> findByUserIdAndStatus(Long userId, RoleAssignmentStatus status);

    /**
     * Find active roles that are within their valid time window.
     * Used by PermissionService for strict time-bound permission checks.
     */
    @Query("SELECT ur FROM UserRole ur WHERE ur.user.id = :userId AND ur.status = 'ACTIVE' " +
            "AND (ur.validFrom IS NULL OR ur.validFrom <= :now) " +
            "AND (ur.validUntil IS NULL OR ur.validUntil > :now)")
    List<UserRole> findActiveRolesInTimeWindow(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    /**
     * Find roles that have passed their validUntil date but are still marked
     * ACTIVE.
     * Used by the expiry scheduler.
     */
    List<UserRole> findByStatusAndValidUntilBefore(RoleAssignmentStatus status, LocalDateTime cutoff);

    void deleteByUser(User user);
}
