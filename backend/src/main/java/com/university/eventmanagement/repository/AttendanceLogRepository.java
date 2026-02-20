package com.university.eventmanagement.repository;

import com.university.eventmanagement.model.AttendanceLog;
import com.university.eventmanagement.model.Event;
import com.university.eventmanagement.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceLogRepository extends JpaRepository<AttendanceLog, Long> {
    List<AttendanceLog> findByEvent(Event event);

    List<AttendanceLog> findByUser(User user);

    Optional<AttendanceLog> findByEventAndUser(Event event, User user);

    boolean existsByEventAndUser(Event event, User user);

    long countByEvent(Event event);

    @Modifying
    @Transactional
    void deleteByEvent(Event event);

    @Modifying
    @Transactional
    void deleteByUser(User user);
}
