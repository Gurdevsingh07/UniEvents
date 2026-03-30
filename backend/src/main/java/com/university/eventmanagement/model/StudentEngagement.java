package com.university.eventmanagement.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_engagement")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentEngagement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;

    @Builder.Default
    private Integer totalRegistered = 0;

    @Builder.Default
    private Integer totalAttended = 0;

    @Builder.Default
    private Integer totalCancelled = 0;

    @Builder.Default
    private Integer noShowCount = 0;

    @Builder.Default
    private Float engagementScore = 0.0f;

    @Column(nullable = false)
    private LocalDateTime lastUpdated;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }
}
