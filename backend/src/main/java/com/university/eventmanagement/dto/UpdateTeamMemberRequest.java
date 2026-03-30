package com.university.eventmanagement.dto;

import lombok.Data;

@Data
public class UpdateTeamMemberRequest {
    private String position;
    private boolean canScanAttendance;
    private boolean canViewAttendanceSheet;
    private boolean canManualOverride;
    private boolean canViewLiveStats;
    private boolean canManageTeam;
    private boolean canManageEvent;
}
