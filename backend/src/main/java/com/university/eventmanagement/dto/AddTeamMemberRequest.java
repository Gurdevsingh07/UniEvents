package com.university.eventmanagement.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddTeamMemberRequest {
    @NotNull(message = "User ID is required")
    private Long userId;
    private String position;
    private boolean canScanAttendance;
    private boolean canViewAttendanceSheet;
    private boolean canManualOverride;
    private boolean canViewLiveStats;
    private boolean canManageTeam;
    private boolean canManageEvent;
}
