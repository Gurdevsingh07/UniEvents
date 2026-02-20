package com.university.eventmanagement.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventStatsResponse {
    private Long eventId;
    private String eventTitle;
    private int capacity;
    private long totalRegistered;
    private long totalPresent;
    private long totalAbsent;
    private double attendancePercentage;
    private int capacityRemaining;
}
