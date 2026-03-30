package com.university.eventmanagement.repository;

import com.university.eventmanagement.model.FaceData;
import com.university.eventmanagement.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface FaceDataRepository extends JpaRepository<FaceData, Long> {
    Optional<FaceData> findByUser(User user);

    Optional<FaceData> findByUserId(Long userId);

    @Modifying
    @Transactional
    void deleteByUser(User user);
}
