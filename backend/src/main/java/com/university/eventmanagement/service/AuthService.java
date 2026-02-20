package com.university.eventmanagement.service;

import com.university.eventmanagement.dto.*;
import com.university.eventmanagement.exception.*;
import com.university.eventmanagement.model.Role;
import com.university.eventmanagement.model.User;
import com.university.eventmanagement.repository.UserRepository;
import com.university.eventmanagement.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final FileService fileService;
    private final FaceService faceService;

    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
            log.info("Authentication successful for email: {}", request.getEmail());
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);

            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            return AuthResponse.builder()
                    .token(jwt)
                    .type("Bearer")
                    .id(user.getId())
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .role(user.getRole().name())
                    .studentId(user.getStudentId())
                    .profilePicture(user.getProfilePicture())
                    .build();
        } catch (Exception e) {
            log.error("Login failed for email: {} - Error: {}", request.getEmail(), e.getMessage());
            throw e;
        }
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered");
        }
        if (request.getStudentId() != null && userRepository.existsByStudentId(request.getStudentId())) {
            throw new DuplicateResourceException("Student ID already registered");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .studentId(request.getStudentId())
                .department(request.getDepartment())
                .phone(request.getPhone())
                .role(Role.STUDENT)
                .build();

        user = Objects.requireNonNull(userRepository.save(user));

        if (request.getFaceEmbedding() != null && !request.getFaceEmbedding().isEmpty()) {
            try {
                faceService.enrollFace(user, request.getFaceEmbedding());
            } catch (Exception e) {
                log.error("Failed to enroll face during registration for user: {}", user.getEmail(), e);
            }
        }

        String jwt = tokenProvider.generateTokenFromEmail(user.getEmail());

        return AuthResponse.builder()
                .token(jwt)
                .type("Bearer")
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .studentId(user.getStudentId())
                .profilePicture(user.getProfilePicture())
                .build();
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public UserResponse getUserProfile() {
        User user = getCurrentUser();
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

    public UserResponse updateProfilePicture(org.springframework.web.multipart.MultipartFile file) {
        System.out.println("DEBUG: AuthService.updateProfilePicture called");
        User user = getCurrentUser();
        System.out.println("DEBUG: Current user found: " + user.getEmail());
        String filePath = fileService.saveFile(file, "profile-pictures");
        System.out.println("DEBUG: File saved at: " + filePath);
        user.setProfilePicture(filePath);
        userRepository.save(user);
        return getUserProfile();
    }
}
