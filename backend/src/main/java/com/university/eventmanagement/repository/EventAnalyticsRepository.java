package com.university.eventmanagement.repository;

import com.university.eventmanagement.model.Event;
import com.university.eventmanagement.model.EventAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EventAnalyticsRepository extends JpaRepository<EventAnalytics, Long> {
    Optional<EventAnalytics> findByEvent(Event event);

    void deleteByEvent(Event event);
}
