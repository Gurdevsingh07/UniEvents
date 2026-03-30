package com.university.eventmanagement.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_scan_log", indexes = {
        @Index(name = "idx_scan_log_event", columnList = "event_id"),
        @Index(name = "idx_scan_log_user", columnList = "user_id"),
        @Index(name = "idx_scan_log_time", columnList = "scannedAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceScanLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    // nullable if face not matched
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private ScanResult result;

    @Column(nullable = false)
    private LocalDateTime scannedAt;

    // 0.0–1.0; 1 = perfect match
    private Double confidenceScore;

    @Column(length = 45)
    private String ipAddress;

    @Column(length = 255)
    private String deviceInfo;

    private Long latencyMs;

    @Column(length = 500)
    private String notes;

    @PrePersist
    protected void onCreate() {
        scannedAt = LocalDateTime.now();
    }

    public enum ScanResult {
        MATCHED,
        NO_MATCH,
        DUPLICATE,
        LIVENESS_FAILED,
        LOW_CONFIDENCE,
        SESSION_CLOSED
    }
}
