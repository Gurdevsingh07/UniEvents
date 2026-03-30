package com.university.eventmanagement.controller;

import com.university.eventmanagement.model.User;
import com.university.eventmanagement.service.FaceService;
import com.university.eventmanagement.repository.UserRepository;
import com.university.eventmanagement.dto.FaceCheckInRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.time.Duration;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bandwidth;

@RestController
@RequestMapping("/api")
@Slf4j
public class FaceController {

    @Autowired
    private FaceService faceService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.university.eventmanagement.service.AttendanceService attendanceService;

    @Autowired
    private com.university.eventmanagement.repository.EventRepository eventRepository;

    // Rate limiting map: Event ID -> Bucket
    private final Map<String, Bucket> lookupBuckets = new ConcurrentHashMap<>();

    @PostMapping("/face/enroll")
    public ResponseEntity<?> enrollFace(
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            @RequestBody Map<String, Object> request,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        try {
            List<Float> embedding = null;
            if (request.get("embedding") instanceof List) {
                embedding = ((List<?>) request.get("embedding")).stream()
                        .map(num -> num instanceof Number ? ((Number) num).floatValue() : null)
                        .filter(java.util.Objects::nonNull)
                        .toList();
            }
            if (embedding == null || embedding.isEmpty()) {
                return ResponseEntity.badRequest().body("Invalid face embedding data");
            }

            Float qualityScore = request.containsKey("qualityScore")
                    ? Float.valueOf(request.get("qualityScore").toString())
                    : 1.0f;
            Float confidence = request.containsKey("confidence") ? Float.valueOf(request.get("confidence").toString())
                    : 1.0f;
            String deviceInfo = request.containsKey("deviceInfo") ? request.get("deviceInfo").toString()
                    : httpRequest.getHeader("User-Agent");
            String ipAddress = httpRequest.getRemoteAddr();

            // Re-enforce policy check: consent must be given
            Boolean consentGiven = request.containsKey("consentGiven") ? (Boolean) request.get("consentGiven") : false;
            if (!consentGiven) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Biometric privacy consent is required for enrollment."));
            }

            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            faceService.enrollFace(user, embedding, qualityScore, confidence, deviceInfo, ipAddress);
            return ResponseEntity.ok(Map.of("message", "Face enrolled successfully"));
        } catch (Exception e) {
            log.error("Error enrolling face for user {}: {}", userDetails.getUsername(), e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Error enrolling face: " + e.getMessage()));
        }
    }

    @DeleteMapping("/face/my-data")
    public ResponseEntity<Map<String, String>> deleteMyBiometricData(
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        try {
            User currentUser = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            faceService.deleteMyBiometricData(currentUser);
            return ResponseEntity.ok(Map.of("message", "Biometric data deleted successfully"));
        } catch (com.university.eventmanagement.exception.ResourceNotFoundException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to delete biometric data", e);
            return ResponseEntity.status(500).body(Map.of("message", "Failed to delete biometric data"));
        }
    }

    @PostMapping("/events/{eventId}/check-in/face")
    public ResponseEntity<?> verifyFace(@PathVariable("eventId") Long eventId,
            @RequestBody FaceCheckInRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        try {
            List<Float> embedding = request.getEmbedding();
            String sessionToken = request.getSessionToken();

            if (embedding == null || embedding.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("status", "ERROR", "message", "Invalid face embedding data"));
            }

            com.university.eventmanagement.model.Event event = eventRepository
                    .findById(java.util.Objects.requireNonNull(eventId))
                    .orElseThrow(() -> new RuntimeException("Event not found"));

            if (event.getAttendanceSessionToken() != null && !event.getAttendanceSessionToken().equals(sessionToken)) {
                return ResponseEntity.status(401).body(Map.of(
                        "status", "UNAUTHORIZED",
                        "message", "Invalid or expired attendance session token"));
            }

            // Apply Rate Limiting based on IP or User (since user isn't authenticated yet,
            // we use IP or a generic key)
            // Ideally we'd have the device ID or IP, but for now we rate limit per event
            // overall to prevent brute force
            // Better approach: rate limit by Event ID to prevent overwhelming the server
            // for a single event
            String bucketKey = "event_" + eventId;
            Bucket bucket = lookupBuckets.computeIfAbsent(bucketKey, k -> {
                // Allows 100 verification attempts per minute per event
                return Bucket.builder()
                        .addLimit(Bandwidth.builder().capacity(100).refillGreedy(100, Duration.ofMinutes(1)).build())
                        .build();
            });

            if (!bucket.tryConsume(1)) {
                log.warn("Rate limit exceeded for face verification on event {}", eventId);
                return ResponseEntity.status(429).body(Map.of(
                        "status", "RATE_LIMITED",
                        "message", "Too many verification attempts. Please wait a moment and try again."));
            }

            String deviceInfo = httpRequest.getHeader("User-Agent");
            String ipAddress = httpRequest.getRemoteAddr();
            boolean livenessPassed = request.isLivenessPassed();

            Map<String, Object> matchResult = faceService.verifyFace(eventId, embedding, ipAddress, deviceInfo,
                    livenessPassed);

            boolean isMatched = (Boolean) matchResult.get("matched");

            if (isMatched) {
                User matchedUser = (User) matchResult.get("user");
                Double confidenceScore = (Double) matchResult.get("confidenceScore");

                // Mark attendance
                try {
                    com.university.eventmanagement.dto.AttendanceResponse attendanceResponse = attendanceService
                            .markAttendance(event, matchedUser);
                    log.info("Face verified and attendance marked for user: {}", matchedUser.getId());
                    return ResponseEntity.ok(Map.of(
                            "status", "MATCHED",
                            "message", "Attendance marked successfully",
                            "confidenceScore", confidenceScore,
                            "user", Map.of(
                                    "id", matchedUser.getId(),
                                    "fullName", matchedUser.getFullName(),
                                    "email", matchedUser.getEmail(),
                                    "studentId", matchedUser.getStudentId() != null ? matchedUser.getStudentId() : ""),
                            "attendance", attendanceResponse));
                } catch (com.university.eventmanagement.exception.DuplicateResourceException de) {
                    // Already checked out, still return success match
                    log.info("User {} already checked out/in: {}", matchedUser.getId(), de.getMessage());
                    return ResponseEntity.ok(Map.of(
                            "status", "ALREADY_CHECKED_IN",
                            "message", de.getMessage(),
                            "confidenceScore", confidenceScore,
                            "user", Map.of(
                                    "id", matchedUser.getId(),
                                    "fullName", matchedUser.getFullName(),
                                    "email", matchedUser.getEmail())));
                }
            } else {
                log.info("Face verification failed - no match found for event {}", eventId);
                return ResponseEntity.status(404).body(Map.of(
                        "status", "NO_MATCH",
                        "message", "Face not recognized. Please try again."));
            }

        } catch (com.university.eventmanagement.exception.BadRequestException e) {
            log.warn("Verification blocked: {}", e.getMessage());
            return ResponseEntity.status(400).body(Map.of(
                    "status", "ERROR",
                    "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error during face verification", e);
            return ResponseEntity.status(500).body(Map.of(
                    "status", "ERROR",
                    "message", "An unexpected error occurred during verification."));
        }
    }

    @PostMapping("/events/{eventId}/face-cache/refresh")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyAuthority('ADMIN', 'ORGANIZER')")
    public ResponseEntity<?> refreshFaceCache(@PathVariable("eventId") Long eventId) {
        try {
            faceService.refreshEventCache(eventId);
            return ResponseEntity.ok(Map.of(
                    "status", "SUCCESS",
                    "message", "Face cache refreshed successfully for event " + eventId));
        } catch (Exception e) {
            log.error("Error refreshing face cache for event {}: {}", eventId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "ERROR",
                    "message", "Error refreshing face cache."));
        }
    }
}
