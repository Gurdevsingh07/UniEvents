package com.university.eventmanagement.repository;

import com.university.eventmanagement.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
        Optional<User> findByEmail(String email);

        Optional<User> findByStudentId(String studentId);

        boolean existsByEmail(String email);

        boolean existsByStudentId(String studentId);

        @Query("SELECT DISTINCT u FROM User u JOIN u.roles ur WHERE ur.role.name = :roleName")
        List<User> findByRoleName(@Param("roleName") String roleName);

        @Query("SELECT COUNT(DISTINCT u) FROM User u JOIN u.roles ur WHERE ur.role.name = :roleName")
        long countByRoleName(@Param("roleName") String roleName);

        /**
         * Find users in a department, excluding anyone who holds a UNIVERSITY-scoped
         * role.
         * This ensures admin accounts are never exposed to organizers.
         */
        @Query("SELECT DISTINCT u FROM User u " +
                        "WHERE u.department.id = :deptId " +
                        "AND u.id NOT IN (SELECT ur.user.id FROM UserRole ur WHERE ur.role.scope = com.university.eventmanagement.model.RoleScope.UNIVERSITY)")
        List<User> findByDepartmentExcludingUniversityScope(@Param("deptId") Long deptId);

        /**
         * Search users within a department by name/studentId, excluding
         * UNIVERSITY-scoped role holders.
         */
        @Query("SELECT DISTINCT u FROM User u " +
                        "WHERE u.department.id = :deptId " +
                        "AND (LOWER(u.fullName) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(u.studentId) LIKE LOWER(CONCAT('%', :q, '%'))) "
                        +
                        "AND u.id NOT IN (SELECT ur.user.id FROM UserRole ur WHERE ur.role.scope = com.university.eventmanagement.model.RoleScope.UNIVERSITY)")
        List<User> searchByDepartmentScope(@Param("deptId") Long deptId, @Param("q") String query);

        /**
         * Find ALL users across all departments, excluding anyone who holds a
         * UNIVERSITY-scoped role.
         */
        @Query("SELECT DISTINCT u FROM User u " +
                        "WHERE u.id NOT IN (SELECT ur.user.id FROM UserRole ur WHERE ur.role.scope = com.university.eventmanagement.model.RoleScope.UNIVERSITY)")
        List<User> findAllExcludingUniversityScope();

        /**
         * Search ALL users across all departments by name/studentId, excluding
         * UNIVERSITY-scoped role holders.
         */
        @Query("SELECT DISTINCT u FROM User u " +
                        "WHERE (LOWER(u.fullName) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(u.studentId) LIKE LOWER(CONCAT('%', :q, '%'))) "
                        +
                        "AND u.id NOT IN (SELECT ur.user.id FROM UserRole ur WHERE ur.role.scope = com.university.eventmanagement.model.RoleScope.UNIVERSITY)")
        List<User> searchAllExcludingUniversityScope(@Param("q") String query);
}
