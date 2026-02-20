package com.university.eventmanagement.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventResponse {
    private Long id;
    private String title;
    private String description;
    private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private LocalTime entryStartTime;
    private LocalTime entryEndTime;
    private String venue;
    private Integer capacity;
    private String status;
    private String createdByName;
    private Long createdById;
    private long registeredCount;
    private long attendedCount;
    private LocalDateTime createdAt;
}
