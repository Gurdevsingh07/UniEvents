package com.university.eventmanagement.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceResponse {
    private Long id;
    private Long eventId;
    private String eventTitle;
    private Long userId;
    private String userName;
    private String studentId;
    private String department;
    private LocalDateTime checkedInAt;
    private String status; // PRESENT, ABSENT
}
