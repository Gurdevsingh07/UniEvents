package com.university.eventmanagement.repository;

import com.university.eventmanagement.model.StudentEngagement;
import com.university.eventmanagement.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentEngagementRepository extends JpaRepository<StudentEngagement, Long> {
    Optional<StudentEngagement> findByUser(User user);
}
