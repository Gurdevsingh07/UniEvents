package com.university.eventmanagement.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "event_analytics")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false, unique = true)
    private Event event;

    private Float attendanceRate;
    private Float cancellationRate;
    private Float noShowRate;
    private Float onSpotPercentage;
    private Float averageCheckinTime;
    private Float performanceScore;

    @Column(nullable = false, updatable = false)
    private LocalDateTime calculatedAt;

    @PrePersist
    protected void onCreate() {
        calculatedAt = LocalDateTime.now();
    }
}
