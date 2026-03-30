package com.university.eventmanagement.repository;

import com.university.eventmanagement.model.Event;
import com.university.eventmanagement.model.EventStatus;
import com.university.eventmanagement.model.Team;
import com.university.eventmanagement.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
        List<Event> findByStatus(EventStatus status);

        List<Event> findByCreatedBy(User createdBy);

        List<Event> findByEventDateAfterOrderByEventDateAsc(LocalDate date);

        List<Event> findByEventDateBeforeOrderByEventDateDesc(LocalDate date);

        List<Event> findAllByOrderByEventDateDesc();

        long countByStatus(EventStatus status);

        List<Event> findByStatusAndEventDateBetweenOrderByEventDateDesc(EventStatus status, LocalDate startDate,
                        LocalDate endDate);

        List<Event> findByCreatedByAndStatusInOrderByEventDateDesc(User createdBy, List<EventStatus> statuses);

        List<Event> findByStatusInAndEventDateBetweenOrderByEventDateDesc(List<EventStatus> statuses,
                        LocalDate startDate,
                        LocalDate endDate);
}
