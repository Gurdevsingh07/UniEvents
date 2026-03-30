package com.university.eventmanagement.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "certificates", indexes = {
        @Index(name = "idx_cert_user", columnList = "user_id"),
        @Index(name = "idx_cert_event", columnList = "event_id"),
        @Index(name = "idx_cert_token", columnList = "downloadToken")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false, unique = true, length = 36)
    private String downloadToken;

    // Relative file path, e.g. certificates/uuid.pdf
    @Column(length = 500)
    private String filePath;

    @Column(nullable = false, updatable = false)
    private LocalDateTime issuedAt;

    private LocalDateTime downloadedAt;

    @Builder.Default
    private int downloadCount = 0;

    @PrePersist
    protected void onCreate() {
        issuedAt = LocalDateTime.now();
        if (downloadToken == null) {
            downloadToken = UUID.randomUUID().toString();
        }
    }
}
