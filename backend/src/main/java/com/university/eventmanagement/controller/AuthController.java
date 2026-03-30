package com.university.eventmanagement.controller;

import com.university.eventmanagement.dto.*;
import com.university.eventmanagement.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bandwidth;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login and registration endpoints")
@lombok.extern.slf4j.Slf4j
public class AuthController {

    private final AuthService authService;
    private final Map<String, Bucket> loginBuckets = new ConcurrentHashMap<>();

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String ipAddress = httpRequest.getRemoteAddr();
        Bucket bucket = loginBuckets.computeIfAbsent(ipAddress, k -> Bucket.builder()
                .addLimit(Bandwidth.builder().capacity(5).refillGreedy(5, Duration.ofMinutes(1)).build())
                .build());

        if (!bucket.tryConsume(1)) {
            log.warn("Rate limit exceeded for login attempts from IP: {}", ipAddress);
            return ResponseEntity.status(429).body(ApiResponse.error("Too many login attempts. Please wait a minute."));
        }

        log.debug("Login attempt for email: {}", request.getEmail());
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    private final Map<String, Bucket> registerBuckets = new ConcurrentHashMap<>();

    @PostMapping("/register")
    @Operation(summary = "Register a new student account")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        String ipAddress = httpRequest.getRemoteAddr();
        Bucket bucket = registerBuckets.computeIfAbsent(ipAddress, k -> Bucket.builder()
                .addLimit(Bandwidth.builder().capacity(3).refillGreedy(3, Duration.ofMinutes(15)).build())
                .build());

        if (!bucket.tryConsume(1)) {
            log.warn("Rate limit exceeded for registration attempts from IP: {}", ipAddress);
            return ResponseEntity.status(429)
                    .body(ApiResponse.error("Too many registration attempts. Please wait 15 minutes."));
        }

        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile() {
        UserResponse response = authService.getUserProfile();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping(value = "/me/picture", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Update current user profile picture")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfilePicture(
            @RequestPart("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            log.debug("Received profile picture update request");
            UserResponse response = authService.updateProfilePicture(file);
            log.debug("Profile picture updated successfully");
            return ResponseEntity.ok(ApiResponse.success("Profile picture updated successfully", response));
        } catch (Exception e) {
            log.error("Failed to update profile picture", e);
            throw e;
        }
    }
}
