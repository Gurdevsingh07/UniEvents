package com.university.eventmanagement.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "face_data")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaceData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String faceEmbedding; // encrypted JSON string of List<Float>

    private Float qualityScore;

    private Float enrollmentConfidence;

    @Column(length = 255)
    private String deviceInfo;

    @Column(length = 45)
    private String ipAddress;

    @Builder.Default
    private int failedAttempts = 0;

    @Builder.Default
    @Column(nullable = true)
    private Boolean consentGiven = false;

    private java.time.LocalDateTime consentGivenAt;

    private java.time.LocalDateTime lastVerifiedAt;

    @Column(nullable = false, updatable = false)
    private java.time.LocalDateTime createdAt;

    private java.time.LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
        updatedAt = java.time.LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = java.time.LocalDateTime.now();
    }
}
