package com.university.eventmanagement.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrationResponse {
    private Long id;
    private Long eventId;
    private String eventTitle;
    private String eventVenue;
    private String eventDate;
    private Long userId;
    private String userName;
    private String studentId;
    private String qrCodeData;
    private LocalDateTime registeredAt;
    private boolean attended;
    private String attendanceStatus; // UPCOMING, PRESENT, ABSENT
}
