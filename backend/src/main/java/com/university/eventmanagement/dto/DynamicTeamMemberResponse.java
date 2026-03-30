package com.university.eventmanagement.dto;

public class DynamicTeamMemberResponse {
    private Long id;
    private UserBasicDTO user;
    private String position;
    private boolean canScanAttendance;
    private boolean canViewAttendanceSheet;
    private boolean canManualOverride;
    private boolean canViewLiveStats;
    private boolean canManageTeam;
    private boolean canManageEvent;
    private String joinedAt;

    public DynamicTeamMemberResponse() {
    }

    public DynamicTeamMemberResponse(Long id, UserBasicDTO user, String position, boolean canScanAttendance,
            boolean canViewAttendanceSheet, boolean canManualOverride, boolean canViewLiveStats, boolean canManageTeam,
            boolean canManageEvent, String joinedAt) {
        this.id = id;
        this.user = user;
        this.position = position;
        this.canScanAttendance = canScanAttendance;
        this.canViewAttendanceSheet = canViewAttendanceSheet;
        this.canManualOverride = canManualOverride;
        this.canViewLiveStats = canViewLiveStats;
        this.canManageTeam = canManageTeam;
        this.canManageEvent = canManageEvent;
        this.joinedAt = joinedAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UserBasicDTO getUser() {
        return user;
    }

    public void setUser(UserBasicDTO user) {
        this.user = user;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public boolean isCanScanAttendance() {
        return canScanAttendance;
    }

    public void setCanScanAttendance(boolean canScanAttendance) {
        this.canScanAttendance = canScanAttendance;
    }

    public boolean isCanViewAttendanceSheet() {
        return canViewAttendanceSheet;
    }

    public void setCanViewAttendanceSheet(boolean canViewAttendanceSheet) {
        this.canViewAttendanceSheet = canViewAttendanceSheet;
    }

    public boolean isCanManualOverride() {
        return canManualOverride;
    }

    public void setCanManualOverride(boolean canManualOverride) {
        this.canManualOverride = canManualOverride;
    }

    public boolean isCanViewLiveStats() {
        return canViewLiveStats;
    }

    public void setCanViewLiveStats(boolean canViewLiveStats) {
        this.canViewLiveStats = canViewLiveStats;
    }

    public boolean isCanManageTeam() {
        return canManageTeam;
    }

    public void setCanManageTeam(boolean canManageTeam) {
        this.canManageTeam = canManageTeam;
    }

    public boolean isCanManageEvent() {
        return canManageEvent;
    }

    public void setCanManageEvent(boolean canManageEvent) {
        this.canManageEvent = canManageEvent;
    }

    public String getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(String joinedAt) {
        this.joinedAt = joinedAt;
    }

    // Builder Pattern
    public static DynamicTeamMemberResponseBuilder builder() {
        return new DynamicTeamMemberResponseBuilder();
    }

    public static class DynamicTeamMemberResponseBuilder {
        private Long id;
        private UserBasicDTO user;
        private String position;
        private boolean canScanAttendance;
        private boolean canViewAttendanceSheet;
        private boolean canManualOverride;
        private boolean canViewLiveStats;
        private boolean canManageTeam;
        private boolean canManageEvent;
        private String joinedAt;

        public DynamicTeamMemberResponseBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public DynamicTeamMemberResponseBuilder user(UserBasicDTO user) {
            this.user = user;
            return this;
        }

        public DynamicTeamMemberResponseBuilder position(String position) {
            this.position = position;
            return this;
        }

        public DynamicTeamMemberResponseBuilder canScanAttendance(boolean canScanAttendance) {
            this.canScanAttendance = canScanAttendance;
            return this;
        }

        public DynamicTeamMemberResponseBuilder canViewAttendanceSheet(boolean canViewAttendanceSheet) {
            this.canViewAttendanceSheet = canViewAttendanceSheet;
            return this;
        }

        public DynamicTeamMemberResponseBuilder canManualOverride(boolean canManualOverride) {
            this.canManualOverride = canManualOverride;
            return this;
        }

        public DynamicTeamMemberResponseBuilder canViewLiveStats(boolean canViewLiveStats) {
            this.canViewLiveStats = canViewLiveStats;
            return this;
        }

        public DynamicTeamMemberResponseBuilder canManageTeam(boolean canManageTeam) {
            this.canManageTeam = canManageTeam;
            return this;
        }

        public DynamicTeamMemberResponseBuilder canManageEvent(boolean canManageEvent) {
            this.canManageEvent = canManageEvent;
            return this;
        }

        public DynamicTeamMemberResponseBuilder joinedAt(String joinedAt) {
            this.joinedAt = joinedAt;
            return this;
        }

        public DynamicTeamMemberResponse build() {
            return new DynamicTeamMemberResponse(id, user, position, canScanAttendance, canViewAttendanceSheet,
                    canManualOverride, canViewLiveStats, canManageTeam, canManageEvent, joinedAt);
        }
    }
}
