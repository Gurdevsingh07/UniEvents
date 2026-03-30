package com.university.eventmanagement.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "team_member_permissions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberPermission {

    @Id
    @Column(name = "team_member_id")
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "team_member_id")
    private TeamMember teamMember;

    @Builder.Default
    private boolean canScanAttendance = false;

    @Builder.Default
    private boolean canViewAttendanceSheet = false;

    @Builder.Default
    private boolean canManualOverride = false;

    @Builder.Default
    private boolean canViewLiveStats = false;

    @Builder.Default
    private boolean canManageTeam = false;

    @Builder.Default
    private boolean canManageEvent = false;
}
