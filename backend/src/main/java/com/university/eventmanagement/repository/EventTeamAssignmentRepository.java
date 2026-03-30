package com.university.eventmanagement.repository;

import com.university.eventmanagement.model.Event;
import com.university.eventmanagement.model.EventTeamAssignment;
import com.university.eventmanagement.model.Team;
import com.university.eventmanagement.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventTeamAssignmentRepository extends JpaRepository<EventTeamAssignment, Long> {
    List<EventTeamAssignment> findByEvent(Event event);

    List<EventTeamAssignment> findByTeam(Team team);

    void deleteByEvent(Event event);

    void deleteByTeam(Team team);

    boolean existsByEventAndTeam(Event event, Team team);

    List<EventTeamAssignment> findByAssignedBy(User user);
}
