package com.university.eventmanagement.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CheckInRequest {
    private Long eventId;
    private String studentId;
    private String sessionToken;
}
