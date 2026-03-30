package com.university.eventmanagement.repository;

import com.university.eventmanagement.model.FaceAuditLog;
import com.university.eventmanagement.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface FaceAuditLogRepository extends JpaRepository<FaceAuditLog, Long> {
    List<FaceAuditLog> findByUserId(Long userId);

    @Modifying
    @Transactional
    void deleteByUser(User user);
}
