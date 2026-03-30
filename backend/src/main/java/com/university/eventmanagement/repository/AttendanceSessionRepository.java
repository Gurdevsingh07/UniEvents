package com.university.eventmanagement.repository;

import com.university.eventmanagement.model.AttendanceSession;
import com.university.eventmanagement.model.AttendanceSession.SessionStatus;
import com.university.eventmanagement.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    Optional<AttendanceSession> findTopByEventIdOrderByCreatedAtDesc(Long eventId);

    Optional<AttendanceSession> findBySessionToken(String token);

    List<AttendanceSession> findByEventIdAndStatus(Long eventId, SessionStatus status);

    Optional<AttendanceSession> findTopByEventIdAndStatusOrderByCreatedAtDesc(Long eventId, SessionStatus status);

    void deleteByStartedBy(User user);
}
