package com.university.eventmanagement.repository;

import com.university.eventmanagement.model.Certificate;
import com.university.eventmanagement.model.Event;
import com.university.eventmanagement.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    List<Certificate> findByUserOrderByIssuedAtDesc(User user);

    Optional<Certificate> findByDownloadToken(String token);

    boolean existsByUserAndEvent(User user, Event event);

    Optional<Certificate> findByUserAndEvent(User user, Event event);

    void deleteByUser(User user);
}
