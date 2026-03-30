package com.university.eventmanagement.repository;

import com.university.eventmanagement.model.Notification;
import com.university.eventmanagement.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    List<Notification> findByUserAndStatusOrderByCreatedAtDesc(User user, String status);

    @Modifying
    @Transactional
    void deleteByUser(User user);
}
