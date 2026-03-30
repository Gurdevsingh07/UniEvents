package com.university.eventmanagement.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_logs", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "event_id", "user_id" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 20)
    private String method; // e.g. FACE_SCAN, MANUAL, QR_SCAN

    @Column(name = "scanned_by_user_id")
    private Long scannedByUserId;

    private Float confidenceScore;

    @Column(nullable = false, updatable = false)
    private LocalDateTime checkedInAt;

    @PrePersist
    protected void onCreate() {
        checkedInAt = LocalDateTime.now();
    }
}
