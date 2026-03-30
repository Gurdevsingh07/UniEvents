package com.university.eventmanagement.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "attendance_sessions", indexes = {
        @Index(name = "idx_session_event", columnList = "event_id"),
        @Index(name = "idx_session_token", columnList = "sessionToken")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false, unique = true, length = 36)
    private String sessionToken;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private SessionStatus status = SessionStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "started_by_user_id")
    private User startedBy;

    @Column(nullable = false)
    private LocalDateTime startedAt;

    private LocalDateTime pausedAt;

    private LocalDateTime closedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (sessionToken == null) {
            sessionToken = UUID.randomUUID().toString();
        }
        if (startedAt == null) {
            startedAt = LocalDateTime.now();
        }
    }

    public enum SessionStatus {
        ACTIVE,
        PAUSED,
        CLOSED
    }
}
