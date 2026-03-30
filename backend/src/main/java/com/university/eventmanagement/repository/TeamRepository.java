package com.university.eventmanagement.repository;

import com.university.eventmanagement.model.Team;
import com.university.eventmanagement.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    Optional<Team> findByName(String name);

    java.util.List<Team> findByCreatedBy(User user);

    java.util.List<Team> findByCreatedByAndIsActiveTrue(User user);

    Optional<Team> findByIdAndIsActiveTrue(Long id);
}
