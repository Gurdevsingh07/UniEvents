package com.university.eventmanagement.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CertificateResponse {
    private Long id;
    private Long eventId;
    private String eventTitle;
    private String eventDate;
    private LocalDateTime issuedAt;
    private String downloadToken;
    private int downloadCount;
}
