package com.university.eventmanagement.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 200)
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull
    @Column(nullable = false)
    private LocalDate eventDate;

    private LocalDate endDate;

    @NotNull
    @Column(nullable = false)
    private LocalTime startTime;

    private LocalTime endTime;

    @Column(name = "entry_start_time")
    private LocalTime entryStartTime;

    @Column(name = "entry_end_time")
    private LocalTime entryEndTime;

    @NotBlank
    @Size(max = 200)
    @Column(nullable = false)
    private String venue;

    @Min(1)
    @Column(nullable = false)
    private Integer capacity;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private EventMode eventMode = EventMode.PRE_SCHEDULED;

    @Column(name = "reminder_sent")
    @Builder.Default
    private boolean reminderSent = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_club_id")
    private Club assignedClub;

    @Column(name = "on_spot_registration_enabled")
    @Builder.Default
    private boolean onSpotRegistrationEnabled = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private EventStatus status = EventStatus.CREATED;

    @Column(name = "attendance_session_token", length = 100)
    private String attendanceSessionToken;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
