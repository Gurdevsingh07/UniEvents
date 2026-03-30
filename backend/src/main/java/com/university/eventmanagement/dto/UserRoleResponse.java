package com.university.eventmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserRoleResponse {
    private Long id;
    private String roleName;
    private String status;
    private String departmentName;
    private String clubName;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private boolean requiresAcceptance;
    private String assignedByName;
    private LocalDateTime assignedAt;
}
