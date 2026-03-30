package com.university.eventmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TaskRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private Long assignedToId;

    private java.util.List<Long> assignedToIds;

    private Long eventId;
    private Long clubId;
    private LocalDateTime deadline;
}
