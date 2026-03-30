package com.university.eventmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpCheckInRequest {
    private String studentId;
    private Long eventId;
    private String otp;
    private String sessionToken;
}
