package com.university.eventmanagement.repository;

import com.university.eventmanagement.model.NoticeTarget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NoticeTargetRepository extends JpaRepository<NoticeTarget, Long> {
}
