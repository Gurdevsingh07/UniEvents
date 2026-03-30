package com.university.eventmanagement.repository;

import com.university.eventmanagement.model.Notice;
import com.university.eventmanagement.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {
        List<Notice> findAllByOrderByCreatedAtDesc();

        @Query("SELECT DISTINCT n FROM Notice n LEFT JOIN n.targets t WHERE " +
                        "t.targetType = 'UNIVERSITY' OR " +
                        "(t.targetType = 'DEPARTMENT' AND t.targetId = :deptId) " +
                        "ORDER BY n.priority ASC, n.createdAt DESC")
        List<Notice> findBaseVisibleNotices(@Param("deptId") Long deptId);

        @Query("SELECT DISTINCT n FROM Notice n JOIN n.targets t WHERE " +
                        "(t.targetType = 'CLUB' AND t.targetId IN :clubIds) OR " +
                        "(t.targetType = 'EVENT' AND t.targetId IN :eventIds)")
        List<Notice> findExtraNotices(@Param("clubIds") List<Long> clubIds, @Param("eventIds") List<Long> eventIds);

        List<Notice> findByCreatedBy(User user);
}
