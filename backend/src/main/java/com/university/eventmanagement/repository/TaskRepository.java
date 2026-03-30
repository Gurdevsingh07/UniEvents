package com.university.eventmanagement.repository;

import com.university.eventmanagement.model.Task;
import com.university.eventmanagement.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByAssignedToIdOrderByDeadlineAsc(Long id);

    List<Task> findByAssignedByIdOrderByCreatedAtDesc(Long id);

    List<Task> findByEventId(Long eventId);

    void deleteByAssignedTo(User user);

    List<Task> findByAssignedBy(User user);
}
