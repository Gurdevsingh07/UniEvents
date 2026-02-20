package com.university.eventmanagement.controller;

import com.university.eventmanagement.dto.*;
import com.university.eventmanagement.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login and registration endpoints")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        System.out.println("DEBUG: Login attempt for email: " + request.getEmail());
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new student account")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
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
            System.out.println("DEBUG: Received profile picture update request");
            UserResponse response = authService.updateProfilePicture(file);
            System.out.println("DEBUG: Profile picture updated successfully");
            return ResponseEntity.ok(ApiResponse.success("Profile picture updated successfully", response));
        } catch (Exception e) {
            System.err.println("ERROR: Failed to update profile picture");
            e.printStackTrace();
            throw e;
        }
    }
}
