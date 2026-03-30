package com.university.eventmanagement.service;

import com.university.eventmanagement.dto.*;
import com.university.eventmanagement.exception.*;
import com.university.eventmanagement.model.*;
import com.university.eventmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final AttendanceLogRepository attendanceLogRepository;
    private final FaceDataRepository faceDataRepository;
    private final PasswordEncoder passwordEncoder;
    private final DepartmentRepository departmentRepository;
    private final FileService fileService;
    private final AppRoleRepository appRoleRepository;
    private final NotificationRepository notificationRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final StudentEngagementRepository studentEngagementRepository;
    private final TeamRepository teamRepository;
    private final NoticeRepository noticeRepository;
    private final FaceAuditLogRepository faceAuditLogRepository;
    private final NoticeReadStatusRepository noticeReadStatusRepository;
    private final AuditLogRepository auditLogRepository;
    private final EventTeamAssignmentRepository eventTeamAssignmentRepository;
    private final UserRoleRepository userRoleRepository;
    private final CertificateRepository certificateRepository;
    private final AttendanceScanLogRepository attendanceScanLogRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final TaskRepository taskRepository;
    private final EventAnalyticsRepository eventAnalyticsRepository;

    public UserResponse createOrganizer(CreateOrganizerRequest request,
            org.springframework.web.multipart.MultipartFile profilePicture) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered");
        }

        String profilePicturePath = null;
        if (profilePicture != null && !profilePicture.isEmpty()) {
            profilePicturePath = fileService.saveFile(profilePicture, "profile-pictures");
        }

        Department dept = null;
        if (request.getDepartment() != null && !request.getDepartment().trim().isEmpty()) {
            dept = departmentRepository.findByName(request.getDepartment())
                    .orElseGet(() -> departmentRepository.save(
                            Department.builder().name(request.getDepartment())
                                    .code(request.getDepartment().toUpperCase().replaceAll("\\s+", "_")).build()));
        }

        User organizer = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .department(dept)
                .phone(request.getPhone())
                .profilePicture(profilePicturePath)
                .build();

        AppRole orgRole = appRoleRepository.findByName("ORGANIZER")
                .orElseGet(() -> appRoleRepository
                        .save(AppRole.builder().name("ORGANIZER").scope(RoleScope.DEPARTMENT).build()));

        organizer.getRoles().add(UserRole.builder().user(organizer).role(orgRole).department(dept).build());

        @SuppressWarnings("null")
        User savedOrganizer = Objects.requireNonNull(userRepository.save(organizer));
        organizer = savedOrganizer;

        return UserResponse.builder()
                .id(organizer.getId())
                .fullName(organizer.getFullName())
                .email(organizer.getEmail())
                .department(organizer.getDepartment() != null ? organizer.getDepartment().getName() : null)
                .phone(organizer.getPhone())
                .role(organizer.getPrimaryRoleName())
                .profilePicture(organizer.getProfilePicture())
                .createdAt(organizer.getCreatedAt().toString())
                .build();
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return mapToResponse(user);
    }

    public List<UserResponse> getUsersByRole(String roleName) {
        return userRepository.findByRoleName(roleName).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public DashboardStats getDashboardStats() {
        return DashboardStats.builder()
                .totalStudents(userRepository.countByRoleName("STUDENT"))
                .totalOrganizers(userRepository.countByRoleName("ORGANIZER"))
                .totalEvents(eventRepository.count())
                .upcomingEvents(eventRepository.countByStatus(EventStatus.CREATED))
                .completedEvents(eventRepository.countByStatus(EventStatus.ATTENDANCE_CLOSED))
                .totalRegistrations(registrationRepository.count())
                .totalAttendance(attendanceLogRepository.count())
                .build();
    }

    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getFullName() != null)
            user.setFullName(request.getFullName());
        if (request.getPhone() != null)
            user.setPhone(request.getPhone());
        if (request.getDepartment() != null && !request.getDepartment().trim().isEmpty()) {
            Department dept = departmentRepository.findByName(request.getDepartment())
                    .orElseGet(() -> departmentRepository.save(
                            Department.builder().name(request.getDepartment())
                                    .code(request.getDepartment().toUpperCase().replaceAll("\\s+", "_")).build()));
            user.setDepartment(dept);
        }

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new DuplicateResourceException("Email already taken");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getRole() != null) {
            AppRole newRole = appRoleRepository.findByName(request.getRole())
                    .orElseGet(() -> appRoleRepository
                            .save(AppRole.builder().name(request.getRole()).scope(RoleScope.UNIVERSITY).build()));
            user.getRoles().clear();
            user.getRoles().add(UserRole.builder().user(user).role(newRole).build());
        }

        return mapToResponse(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id) {
        log.info("Attempting to delete user with ID: {}", id);
        User user = userRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        log.info("Found user: {} ({}) with primary role: {}", user.getFullName(), user.getEmail(),
                user.getPrimaryRoleName());

        if (user.getPrimaryRoleName().equals("ADMIN")) {
            log.warn("Blocked attempt to delete administrator account: {}", user.getEmail());
            throw new BadRequestException("Cannot delete an administrator account");
        }

        // 1. Cleanup ALL Events created by this user
        log.info("Checking for events created by: {}", user.getEmail());
        List<Event> events = eventRepository.findByCreatedBy(user);
        log.info("Found {} events created by this user to cleanup", events.size());
        for (Event event : events) {
            log.debug("Cleaning up dependencies for event ID: {} ({})", event.getId(), event.getTitle());
            attendanceLogRepository.deleteByEvent(event);
            registrationRepository.deleteByEvent(event);
            attendanceScanLogRepository.deleteByEvent(event);
            eventAnalyticsRepository.deleteByEvent(event);
            attendanceLogRepository.flush();
            registrationRepository.flush();
            attendanceScanLogRepository.flush();
            eventAnalyticsRepository.flush();

            log.debug("Deleting event record...");
            eventRepository.delete(event);
            eventRepository.flush();
        }

        // 2. Global Biometric & Event Enrollment Cleanup
        log.info("Performing global bio-metric and registration cleanup for: {}", user.getEmail());
        registrationRepository.deleteByUser(user);
        registrationRepository.flush();

        attendanceLogRepository.deleteByUser(user);
        attendanceLogRepository.flush();

        faceDataRepository.deleteByUser(user);
        faceDataRepository.flush();

        faceAuditLogRepository.deleteByUser(user);
        faceAuditLogRepository.flush();

        noticeReadStatusRepository.deleteByUser(user);
        noticeReadStatusRepository.flush();

        auditLogRepository.deleteByUserId(user.getId());
        auditLogRepository.flush();

        notificationRepository.deleteByUser(user);
        notificationRepository.flush();

        // Cleanup TeamMember assignments made by this user
        List<TeamMember> assignments = teamMemberRepository.findByAssignedBy(user);
        for (TeamMember tm : assignments) {
            tm.setAssignedBy(null);
            teamMemberRepository.save(tm);
        }
        teamMemberRepository.flush();

        // Cleanup EventTeamAssignment made by this user
        List<EventTeamAssignment> teamAssignments = eventTeamAssignmentRepository.findByAssignedBy(user);
        for (EventTeamAssignment eta : teamAssignments) {
            eta.setAssignedBy(null);
            eventTeamAssignmentRepository.save(eta);
        }
        eventTeamAssignmentRepository.flush();

        // Cleanup Task management
        // 1. Set assignedBy to null for tasks created by this user
        List<Task> tasksCreated = taskRepository.findByAssignedBy(user);
        for (Task t : tasksCreated) {
            t.setAssignedBy(null);
            taskRepository.save(t);
        }
        taskRepository.flush();
        // 2. Delete tasks assigned to this user
        taskRepository.deleteByAssignedTo(user);
        taskRepository.flush();

        // Cleanup Attendance Sessions started by this user
        attendanceSessionRepository.deleteByStartedBy(user);
        attendanceSessionRepository.flush();

        teamMemberRepository.deleteByUserId(user.getId());
        teamMemberRepository.flush();

        // Cleanup Teams created by the user
        List<Team> teamsCreated = teamRepository.findByCreatedBy(user);
        for (Team team : teamsCreated) {
            eventTeamAssignmentRepository.deleteByTeam(team);
            eventTeamAssignmentRepository.flush();

            teamMemberRepository.deleteByTeamId(team.getId());
            teamMemberRepository.flush();

            teamRepository.delete(team);
        }
        teamRepository.flush();

        // Cleanup Notices created by the user
        List<Notice> noticesCreated = noticeRepository.findByCreatedBy(user);
        for (Notice notice : noticesCreated) {
            if (notice != null) {
                noticeRepository.delete(notice);
            }
        }
        noticeRepository.flush();

        studentEngagementRepository.findByUser(user).ifPresent(studentEngagementRepository::delete);
        studentEngagementRepository.flush();

        // Cleanup Certificates earned by the user
        certificateRepository.deleteByUser(user);
        certificateRepository.flush();

        // Cleanup Attendance Scan Logs for the user
        attendanceScanLogRepository.deleteByUser(user);
        attendanceScanLogRepository.flush();

        // Cleanup UserRole assignments
        userRoleRepository.deleteByUser(user);
        userRoleRepository.flush();

        // 3. Final User Record Deletion
        log.info("Deleting primary user record for ID: {}", id);
        userRepository.delete(user);
        log.info("User {} deleted successfully", user.getEmail());
    }

    @Transactional(readOnly = true)
    public List<OrganizerWithTeamsResponse> getOrganizersWithTeams() {
        List<User> organizers = userRepository.findAll().stream()
                .filter(u -> "ORGANIZER".equals(u.getPrimaryRoleName()))
                .collect(Collectors.toList());

        List<Team> allTeams = teamRepository.findAll();

        return organizers.stream().map(org -> {
            List<TeamResponse> orgTeams = allTeams.stream()
                    .filter(t -> t.getCreatedBy() != null && t.getCreatedBy().getId().equals(org.getId()))
                    .filter(Team::isActive)
                    .map(this::mapToTeamResponse)
                    .collect(Collectors.toList());

            OrganizerWithTeamsResponse res = new OrganizerWithTeamsResponse();
            res.setId(org.getId());
            res.setFullName(org.getFullName());
            res.setEmail(org.getEmail());
            res.setTeams(orgTeams);
            return res;
        }).collect(Collectors.toList());
    }

    private TeamResponse mapToTeamResponse(Team team) {
        if (team == null)
            return null;
        UserBasicDTO createdByDto = null;
        if (team.getCreatedBy() != null) {
            createdByDto = new UserBasicDTO();
            createdByDto.setId(team.getCreatedBy().getId());
            createdByDto.setFullName(team.getCreatedBy().getFullName());
            createdByDto.setEmail(team.getCreatedBy().getEmail());
        }

        TeamResponse res = new TeamResponse();
        res.setId(team.getId());
        res.setName(team.getName());
        res.setDescription(team.getDescription());
        res.setPurpose(team.getPurpose());
        res.setCreatedBy(createdByDto);
        res.setCreatedAt(team.getCreatedAt() != null ? team.getCreatedAt().toString() : null);
        return res;
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .studentId(user.getStudentId())
                .department(user.getDepartment() != null ? user.getDepartment().getName() : null)
                .phone(user.getPhone())
                .role(user.getPrimaryRoleName())
                .profilePicture(user.getProfilePicture())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }
}
