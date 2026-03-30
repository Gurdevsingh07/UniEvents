package com.university.eventmanagement.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private UserResponse assignedTo;
    private UserResponse assignedBy;
    private Long eventId;
    private String eventTitle;
    private Long clubId;
    private String clubName;
    private LocalDateTime deadline;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
