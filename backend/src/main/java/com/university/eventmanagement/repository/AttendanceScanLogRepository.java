package com.university.eventmanagement.repository;

import com.university.eventmanagement.model.AttendanceScanLog;
import com.university.eventmanagement.model.Event;
import com.university.eventmanagement.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AttendanceScanLogRepository extends JpaRepository<AttendanceScanLog, Long> {
    List<AttendanceScanLog> findByEventOrderByScannedAtDesc(Event event);

    long countByEventAndScannedAtAfter(Event event, LocalDateTime since);

    long countByEventAndUserIdAndScannedAtAfter(Event event, Long userId, LocalDateTime since);

    @Query("SELECT s FROM AttendanceScanLog s WHERE s.event.id = :eventId AND s.user.id = :userId " +
            "AND s.scannedAt > :since ORDER BY s.scannedAt DESC")
    List<AttendanceScanLog> findRecentScansForUser(Long eventId, Long userId, LocalDateTime since);

    @Query("SELECT AVG(s.latencyMs) FROM AttendanceScanLog s WHERE s.event.id = :eventId AND s.latencyMs IS NOT NULL")
    Double findAverageLatencyByEventId(Long eventId);

    @Query("SELECT AVG(s.latencyMs) FROM AttendanceScanLog s WHERE s.latencyMs IS NOT NULL")
    Double findOverallAverageLatency();

    void deleteByUser(User user);

    void deleteByEvent(Event event);
}
