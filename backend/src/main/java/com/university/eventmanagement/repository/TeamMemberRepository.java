package com.university.eventmanagement.repository;

import com.university.eventmanagement.model.TeamMember;
import com.university.eventmanagement.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    Optional<TeamMember> findByIdAndIsActiveTrue(Long id);

    List<TeamMember> findByTeamIdAndIsActiveTrue(Long teamId);

    List<TeamMember> findByUserIdAndIsActiveTrue(Long userId);

    Optional<TeamMember> findByTeamIdAndUserIdAndIsActiveTrue(Long teamId, Long userId);

    java.util.List<TeamMember> findByAssignedBy(User assignedBy);

    java.util.List<TeamMember> findByAssignedByAndIsActiveTrue(User assignedBy);

    void deleteByTeamId(Long teamId);

    void deleteByUserId(Long userId);
}
