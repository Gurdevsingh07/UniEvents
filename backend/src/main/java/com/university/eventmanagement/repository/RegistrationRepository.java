package com.university.eventmanagement.repository;

import com.university.eventmanagement.model.Registration;
import com.university.eventmanagement.model.Event;
import com.university.eventmanagement.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    List<Registration> findByEvent(Event event);

    List<Registration> findByEventId(Long eventId);

    List<Registration> findByUser(User user);

    Optional<Registration> findByEventAndUser(Event event, User user);

    boolean existsByEventAndUser(Event event, User user);

    long countByEvent(Event event);

    long countByEventAndStatus(Event event, com.university.eventmanagement.model.RegistrationStatus status);

    long countByEventAndRegistrationType(Event event, com.university.eventmanagement.model.RegistrationType type);

    Optional<Registration> findFirstByEventAndStatusOrderByRegisteredAtAsc(Event event,
            com.university.eventmanagement.model.RegistrationStatus status);

    List<Registration> findByEventAndStatusOrderByRegisteredAtAsc(Event event,
            com.university.eventmanagement.model.RegistrationStatus status);

    @Modifying
    @Transactional
    void deleteByEvent(Event event);

    @Modifying
    @Transactional
    void deleteByUser(User user);
}
