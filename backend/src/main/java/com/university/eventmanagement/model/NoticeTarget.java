package com.university.eventmanagement.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notice_targets", indexes = {
        @Index(name = "idx_notice_target", columnList = "targetType, targetId")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoticeTarget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notice_id", nullable = false)
    private Notice notice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TargetType targetType;

    // This refers to the ID of the Department, Club, or Event. Null if targetType
    // is UNIVERSITY.
    private Long targetId;
}
