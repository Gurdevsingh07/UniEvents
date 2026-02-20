package com.university.eventmanagement.controller;

import com.university.eventmanagement.model.User;
import com.university.eventmanagement.service.FaceService;
import com.university.eventmanagement.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    @PostMapping("/face/enroll")
    public ResponseEntity<?> enrollFace(
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            @RequestBody Map<String, List<Float>> request) {
        try {
            List<Float> embedding = request.get("embedding");
            if (embedding == null || embedding.isEmpty()) {
                return ResponseEntity.badRequest().body("Invalid face embedding data");
            }

            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            faceService.enrollFace(user, embedding);
            return ResponseEntity.ok("Face enrolled successfully");
        } catch (Exception e) {
            log.error("Error enrolling face for user {}: {}", userDetails.getUsername(), e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error enrolling face. Please try again.");
        }
    }

    @PostMapping("/events/{eventId}/check-in/face")
    public ResponseEntity<?> verifyFace(@PathVariable("eventId") Long eventId,
            @RequestBody Map<String, List<Float>> request) {
        try {
            List<Float> embedding = request.get("embedding");
            if (embedding == null || embedding.isEmpty()) {
                return ResponseEntity.badRequest().body("Invalid face embedding data");
            }

            User matchedUser = faceService.verifyFace(eventId, embedding);

            if (matchedUser != null) {
                // Mark attendance
                com.university.eventmanagement.model.Event event = eventRepository.findById(eventId)
                        .orElseThrow(() -> new RuntimeException("Event not found"));

                try {
                    var attendanceResponse = attendanceService.markAttendance(event, matchedUser);
                    log.info("Face verified and attendance marked for user: {}", matchedUser.getId());
                    return ResponseEntity.ok(Map.of(
                            "status", "MATCHED",
                            "message", "Attendance marked successfully",
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
                            "status", "MATCHED",
                            "message", de.getMessage(),
                            "user", Map.of(
                                    "id", matchedUser.getId(),
                                    "fullName", matchedUser.getFullName(),
                                    "email", matchedUser.getEmail())));
                }
            } else {
                log.info("Face verification failed - no match found for event {}", eventId);
                return ResponseEntity.status(401).body(Map.of(
                        "status", "NO_MATCH",
                        "message", "Face not recognized. Please try again."));
            }
        } catch (Exception e) {
            log.error("Error verifying face for event {}: {}", eventId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "ERROR",
                    "message", "Error verifying face. Please try again."));
        }
    }
}
