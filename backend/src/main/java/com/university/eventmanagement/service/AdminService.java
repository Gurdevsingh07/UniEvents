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
    private final FileService fileService;

    public UserResponse createOrganizer(CreateOrganizerRequest request,
            org.springframework.web.multipart.MultipartFile profilePicture) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered");
        }

        String profilePicturePath = null;
        if (profilePicture != null && !profilePicture.isEmpty()) {
            profilePicturePath = fileService.saveFile(profilePicture, "profile-pictures");
        }

        User organizer = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .department(request.getDepartment())
                .phone(request.getPhone())
                .role(Role.ORGANIZER)
                .profilePicture(profilePicturePath)
                .build();

        @SuppressWarnings("null")
        User savedOrganizer = Objects.requireNonNull(userRepository.save(organizer));
        organizer = savedOrganizer;

        return UserResponse.builder()
                .id(organizer.getId())
                .fullName(organizer.getFullName())
                .email(organizer.getEmail())
                .department(organizer.getDepartment())
                .phone(organizer.getPhone())
                .role(organizer.getRole().name())
                .profilePicture(organizer.getProfilePicture())
                .createdAt(organizer.getCreatedAt().toString())
                .build();
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<UserResponse> getUsersByRole(Role role) {
        return userRepository.findByRole(role).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public DashboardStats getDashboardStats() {
        return DashboardStats.builder()
                .totalStudents(userRepository.countByRole(Role.STUDENT))
                .totalOrganizers(userRepository.countByRole(Role.ORGANIZER))
                .totalEvents(eventRepository.count())
                .upcomingEvents(eventRepository.countByStatus(EventStatus.UPCOMING))
                .completedEvents(eventRepository.countByStatus(EventStatus.COMPLETED))
                .totalRegistrations(registrationRepository.count())
                .totalAttendance(attendanceLogRepository.count())
                .build();
    }

    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getFullName() != null)
            user.setFullName(request.getFullName());
        if (request.getPhone() != null)
            user.setPhone(request.getPhone());
        if (request.getDepartment() != null)
            user.setDepartment(request.getDepartment());

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new DuplicateResourceException("Email already taken");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }

        return mapToResponse(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id) {
        log.info("Attempting to delete user with ID: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        log.info("Found user: {} ({}) with role: {}", user.getFullName(), user.getEmail(), user.getRole());

        if (user.getRole() == Role.ADMIN) {
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
            attendanceLogRepository.flush();
            registrationRepository.flush();

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

        // 3. Final User Record Deletion
        log.info("Deleting primary user record for ID: {}", id);
        userRepository.delete(user);
        userRepository.flush();

        log.info("User {} deleted successfully", user.getEmail());
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .studentId(user.getStudentId())
                .department(user.getDepartment())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .profilePicture(user.getProfilePicture())
                .createdAt(user.getCreatedAt().toString())
                .build();
    }
}
