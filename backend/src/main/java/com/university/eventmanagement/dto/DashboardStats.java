package com.university.eventmanagement.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStats {
    private long totalStudents;
    private long totalOrganizers;
    private long totalEvents;
    private long upcomingEvents;
    private long completedEvents;
    private long totalRegistrations;
    private long totalAttendance;
}
