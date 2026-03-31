package com.university.eventmanagement.service;

import com.university.eventmanagement.model.Event;
import com.university.eventmanagement.model.TeamMember;
import com.university.eventmanagement.model.User;
import com.university.eventmanagement.model.EventTeamAssignment;
import com.university.eventmanagement.repository.EventTeamAssignmentRepository;
import com.university.eventmanagement.repository.TeamMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventAccessService {

    private final TeamMemberRepository teamMemberRepository;
    private final EventTeamAssignmentRepository eventTeamAssignmentRepository;

    public boolean canManageEvent(Event event, User user) {
        if (user.getPrimaryRoleName().equals("ADMIN")) {
            return true;
        }
        if (event.getCreatedBy() != null && event.getCreatedBy().getId().equals(user.getId())) {
            return true;
        }

        // Check Club delegation (If user department matches club department and user is
        // ORGANIZER)
        if (event.getAssignedClub() != null && user.getDepartment() != null) {
            if (event.getAssignedClub().getDepartment() != null &&
                    event.getAssignedClub().getDepartment().getId().equals(user.getDepartment().getId())) {
                if (user.getRoles().stream().anyMatch(r -> r.getRole().getName().equals("ORGANIZER")
                        || r.getRole().getName().equals("CLUB_PRESIDENT"))) {
                    return true;
                }
            }
        }

        // Check Team delegation
        List<EventTeamAssignment> assignments = eventTeamAssignmentRepository.findByEvent(event);
        for (EventTeamAssignment assignment : assignments) {
            Optional<TeamMember> teamMember = teamMemberRepository
                    .findByTeamIdAndUserIdAndIsActiveTrue(assignment.getTeam().getId(), user.getId());
            if (teamMember.isPresent()) {
                TeamMember member = teamMember.get();
                if (member.getPermission() != null && member.getPermission().isCanManageEvent()) {
                    return true;
                }
            }
        }

        return false;
    }

    public boolean canViewReports(Event event, User user) {
        if (user.getPrimaryRoleName().equals("ADMIN")) {
            return true;
        }
        if (event.getCreatedBy() != null && event.getCreatedBy().getId().equals(user.getId())) {
            return true;
        }

        // Check Team delegation for specific report permissions
        List<EventTeamAssignment> assignments = eventTeamAssignmentRepository.findByEvent(event);
        for (EventTeamAssignment assignment : assignments) {
            Optional<TeamMember> teamMember = teamMemberRepository
                    .findByTeamIdAndUserIdAndIsActiveTrue(assignment.getTeam().getId(), user.getId());
            if (teamMember.isPresent()) {
                TeamMember member = teamMember.get();
                if (member.getPermission() != null &&
                        (member.getPermission().isCanViewAttendanceSheet()
                                || member.getPermission().isCanViewLiveStats())) {
                    return true;
                }
            }
        }

        // Default to canManageEvent if no specific team permission check needed?
        // Actually, Feature 2.10 is strict. So we only allow if they have specific
        // permissions or are ADMIN/Creator.
        return false;
    }

    public boolean canScanAttendance(Event event, User user) {
        if (canManageEvent(event, user)) {
            return true;
        }

        List<EventTeamAssignment> assignments = eventTeamAssignmentRepository.findByEvent(event);
        for (EventTeamAssignment assignment : assignments) {
            Optional<TeamMember> teamMember = teamMemberRepository
                    .findByTeamIdAndUserIdAndIsActiveTrue(assignment.getTeam().getId(), user.getId());
            if (teamMember.isPresent()) {
                TeamMember member = teamMember.get();
                if (member.getPermission() != null && member.getPermission().isCanScanAttendance()) {
                    return true;
                }
            }
        }
        return false;
    }

    public boolean canManualOverride(Event event, User user) {
        if (canManageEvent(event, user)) {
            return true;
        }

        List<EventTeamAssignment> assignments = eventTeamAssignmentRepository.findByEvent(event);
        for (EventTeamAssignment assignment : assignments) {
            Optional<TeamMember> teamMember = teamMemberRepository
                    .findByTeamIdAndUserIdAndIsActiveTrue(assignment.getTeam().getId(), user.getId());
            if (teamMember.isPresent()) {
                TeamMember member = teamMember.get();
                if (member.getPermission() != null && member.getPermission().isCanManualOverride()) {
                    return true;
                }
            }
        }
        return false;
    }
}
