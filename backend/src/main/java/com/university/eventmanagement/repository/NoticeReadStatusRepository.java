package com.university.eventmanagement.repository;

import com.university.eventmanagement.model.Notice;
import com.university.eventmanagement.model.NoticeReadStatus;
import com.university.eventmanagement.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface NoticeReadStatusRepository extends JpaRepository<NoticeReadStatus, Long> {
    boolean existsByNoticeAndUser(Notice notice, User user);

    Optional<NoticeReadStatus> findByNoticeAndUser(Notice notice, User user);

    @Modifying
    @Transactional
    void deleteByUser(User user);
}
