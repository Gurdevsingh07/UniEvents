package com.university.eventmanagement.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.university.eventmanagement.model.*;
import com.university.eventmanagement.repository.FaceDataRepository;
import com.university.eventmanagement.repository.RegistrationRepository;
import com.university.eventmanagement.repository.UserRepository;
import com.university.eventmanagement.repository.EventRepository;
import com.university.eventmanagement.repository.FaceAuditLogRepository;
import com.university.eventmanagement.util.BiometricEncryptionUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class FaceService {

    @Autowired
    private FaceDataRepository faceDataRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private RegistrationRepository registrationRepository;

    @Autowired
    private FaceAuditLogRepository faceAuditLogRepository;

    @Autowired
    private com.university.eventmanagement.repository.AttendanceScanLogRepository scanLogRepository;

    @Autowired
    private AuditService auditService;

    @Autowired
    private org.springframework.context.ApplicationContext applicationContext;

    private AttendanceSessionService getSessionService() {
        return applicationContext.getBean(AttendanceSessionService.class);
    }

    @Autowired
    private BiometricEncryptionUtil encryptionUtil;

    @Value("${app.face.match-threshold:0.65}")
    private double matchThreshold;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Map of Event ID -> (Map of User ID -> Face Embedding)
    private final java.util.Map<Long, java.util.Map<Long, List<Float>>> eventFaceCache = new java.util.concurrent.ConcurrentHashMap<>();

    // Map of Event ID -> (Map of User ID -> Last Scan Time) for duplicate
    // prevention
    private final java.util.Map<Long, java.util.Map<Long, LocalDateTime>> recentScansCache = new java.util.concurrent.ConcurrentHashMap<>();

    public void invalidateCache(Long eventId) {
        if (eventId != null) {
            eventFaceCache.remove(eventId);
            recentScansCache.remove(eventId);
            log.info("Invalidated face cache for event ID: {}", eventId);
        } else {
            eventFaceCache.clear();
            recentScansCache.clear();
            log.info("Invalidated all face caches");
        }
    }

    /**
     * Cleans up face embeddings from memory for events that have already ended.
     * Runs every hour.
     */
    @Scheduled(fixedRate = 3600000)
    public void cleanupExpiredFaceCaches() {
        if (eventFaceCache.isEmpty()) {
            return;
        }

        log.info("Running scheduled cleanup for expired event face caches...");
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        eventFaceCache.keySet().removeIf(eventId -> {
            try {
                return eventRepository.findById(Objects.requireNonNull(eventId)).map(event -> {
                    // Remove if the event was yesterday or earlier
                    if (event.getEventDate().isBefore(today)) {
                        return true;
                    }
                    // Remove if the event is today but its end time (or entry end time) has passed
                    if (event.getEventDate().isEqual(today)) {
                        LocalTime relevantEndTime = event.getEntryEndTime() != null ? event.getEntryEndTime()
                                : event.getEndTime();
                        if (relevantEndTime != null && now.isAfter(relevantEndTime)) {
                            return true;
                        }
                    }
                    return false;
                }).orElse(true); // Remove if event no longer exists
            } catch (Exception e) {
                log.error("Error evaluating cache eviction for event {}", eventId, e);
                return false;
            }
        });

        log.info("Cache cleanup complete. Currently tracking {} active events in memory.", eventFaceCache.size());
        recentScansCache.keySet().retainAll(eventFaceCache.keySet());
    }

    public void refreshEventCache(Long eventId) {
        log.info("Refreshing face cache for eventId: {}", eventId);

        Event event = eventRepository.findById(Objects.requireNonNull(eventId)).orElse(null);
        if (event == null)
            return;

        List<FaceData> facesToCache;
        if (event.getEventMode() == EventMode.INSTANT || Boolean.TRUE.equals(event.isOnSpotRegistrationEnabled())) {
            facesToCache = faceDataRepository.findAll();
        } else {
            List<Registration> registrations = registrationRepository.findByEvent(event);
            facesToCache = registrations.stream()
                    .map(Registration::getUser)
                    .filter(User::isFaceEnrolled)
                    .map(user -> faceDataRepository.findByUser(user).orElse(null))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        }

        java.util.Map<Long, List<Float>> userEmbeddings = new java.util.concurrent.ConcurrentHashMap<>();

        for (FaceData fd : facesToCache) {
            User user = fd.getUser();
            try {
                String encryptedEmbeddingStr = fd.getFaceEmbedding();
                if (encryptedEmbeddingStr != null && !encryptedEmbeddingStr.isEmpty()) {
                    // 12-month Expiry Check (Feature 1.4)
                    java.time.LocalDateTime lastUpdate = fd.getUpdatedAt() != null ? fd.getUpdatedAt()
                            : fd.getCreatedAt();
                    if (lastUpdate != null && lastUpdate.isBefore(java.time.LocalDateTime.now().minusMonths(12))) {
                        log.warn("Face data for user {} expired (12+ months old). Skipping cache.", user.getId());
                        continue;
                    }

                    // Fraud Detection Skip (Feature 5.3)
                    if (fd.getFailedAttempts() >= 5) {
                        log.warn("User {} account flagged for biometric fraud/failed attempts. Skipping cache.",
                                user.getId());
                        continue;
                    }

                    String decryptedStr = encryptionUtil.decrypt(encryptedEmbeddingStr);
                    List<Float> storedEmbedding = objectMapper.readValue(
                            decryptedStr,
                            objectMapper.getTypeFactory().constructCollectionType(List.class, Float.class));
                    userEmbeddings.put(user.getId(), storedEmbedding);
                }
            } catch (Exception e) {
                log.error("Error decrypting/parsing face embedding for user {}: {}", user.getId(), e.getMessage());
            }
        }
        eventFaceCache.put(eventId, userEmbeddings);
        log.info("Loaded {} decrypted face embeddings into cache for event {}", userEmbeddings.size(), eventId);
    }

    @Transactional
    public void enrollFace(User user, List<Float> faceEmbedding, Float qualityScore, Float confidence,
            String deviceInfo, String ipAddress) throws Exception {
        log.info("Enrolling face data for user ID: {}", user.getId());

        // 1. UPDATE POLICY CHECK (Feature 1.4: 1 update per semester/120 days)
        Optional<FaceData> existingData = faceDataRepository.findByUser(user);
        if (existingData.isPresent()) {
            java.time.LocalDateTime lastUpdate = existingData.get().getUpdatedAt();
            if (lastUpdate != null && lastUpdate.isAfter(java.time.LocalDateTime.now().minusDays(120))) {
                // Check if it's the same device/IP maybe? No, policy says 1 update per
                // semester.
                // However, we allow "re-enrollment" if it's the same person fixing a poor scan.
                // But let's stick to the strict rule for now or a slightly softer one.
                log.warn("User {} attempted multiple enrollments in one semester", user.getId());
                throw new Exception("Face data can only be updated once per semester (120 days).");
            }
        }

        // 2. DUPLICATE FACE DETECTION
        List<FaceData> allFaces = faceDataRepository.findAll();
        for (FaceData existingFace : allFaces) {
            if (!existingFace.getUser().getId().equals(user.getId())) {
                try {
                    String decryptedExisting = encryptionUtil.decrypt(existingFace.getFaceEmbedding());
                    List<Float> existingEmbedding = objectMapper.readValue(decryptedExisting,
                            objectMapper.getTypeFactory().constructCollectionType(List.class, Float.class));

                    double distance = calculateEuclideanDistance(faceEmbedding, existingEmbedding);
                    if (distance < matchThreshold) {
                        saveAuditLog(user, "FAIL", "Face already registered by another user. Distance: " + distance,
                                deviceInfo);
                        throw new Exception("Duplicate face detected: This face is already enrolled.");
                    }
                } catch (Exception e) {
                    log.warn("Error checking duplicate against FaceData ID {}", existingFace.getId(), e);
                }
            }
        }

        // 3. ENCRYPTION & STORAGE
        String embeddingJson = objectMapper.writeValueAsString(faceEmbedding);
        String encryptedEmbedding = encryptionUtil.encrypt(embeddingJson);

        FaceData faceData = existingData.orElseGet(() -> {
            FaceData fd = new FaceData();
            fd.setUser(user);
            return fd;
        });

        faceData.setFaceEmbedding(encryptedEmbedding);
        faceData.setQualityScore(qualityScore);
        faceData.setEnrollmentConfidence(confidence);
        faceData.setDeviceInfo(deviceInfo);
        faceData.setIpAddress(ipAddress);

        faceDataRepository.saveAndFlush(faceData);

        // 4. SELF-VERIFICATION TEST (Feature 1.4: Multi-frame sync test)
        try {
            String verifyDecrypted = encryptionUtil.decrypt(faceData.getFaceEmbedding());
            List<Float> savedEmbedding = objectMapper.readValue(verifyDecrypted,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Float.class));
            double testDistance = calculateEuclideanDistance(faceEmbedding, savedEmbedding);
            if (testDistance > 0.01) { // Floating point precision check mainly
                throw new Exception("Biometric integrity check failed. Please re-enroll.");
            }
        } catch (Exception e) {
            log.error("Internal verification failed for user {}", user.getId(), e);
            throw new Exception("Enrollment failed: " + e.getMessage());
        }

        log.debug("Encrypted FaceData record synchronized for user ID: {}", user.getId());

        // Update user status
        String actionType = user.isFaceEnrolled() ? "UPDATE" : "ENROLL";
        user.setFaceEnrolled(true);
        userRepository.saveAndFlush(user);

        // Audit Logging
        saveAuditLog(user, actionType, "Face enrolled successfully. Quality: " + qualityScore, deviceInfo);

        // Invalidate all caches
        invalidateCache(null);

        log.info("Face enrollment status finalized for user: {}", user.getEmail());
    }

    private void saveAuditLog(User user, String action, String description, String deviceInfo) {
        FaceAuditLog auditLog = FaceAuditLog.builder()
                .user(user)
                .actionType(action)
                .description(description)
                .deviceInfo(deviceInfo)
                .build();
        faceAuditLogRepository.save(Objects.requireNonNull(auditLog));
    }

    @Transactional
    public void deleteMyBiometricData(User user) {
        log.info("Deleting biometric data for user ID: {}", user.getId());

        Optional<FaceData> faceDataOpt = faceDataRepository.findByUser(user);
        if (faceDataOpt.isPresent()) {
            faceDataRepository.delete(faceDataOpt.get());

            user.setFaceEnrolled(false);
            userRepository.save(user);

            saveAuditLog(user, "DELETE", "User requested deletion of biometric data (GDPR)", "N/A");
            invalidateCache(null);
            log.info("Biometric data deleted successfully for user {}", user.getEmail());
        } else {
            throw new com.university.eventmanagement.exception.ResourceNotFoundException(
                    "No biometric data found for this user");
        }
    }

    public Map<String, Object> verifyFace(Long eventId, List<Float> inputEmbedding, String ipAddress, String deviceInfo,
            boolean livenessPassed) throws Exception {
        long startTime = System.currentTimeMillis();
        log.debug("verifyFace called for eventId: {}", eventId);

        if (eventId == null) {
            throw new IllegalArgumentException("Event ID cannot be null for face verification.");
        }

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new com.university.eventmanagement.exception.ResourceNotFoundException(
                        "Event not found"));

        // Check if an active session exists
        if (!getSessionService().isScanningAllowed(eventId)) {
            log.warn("Scan attempt for event {} without active session", eventId);
            saveScanLog(event, null, AttendanceScanLog.ScanResult.SESSION_CLOSED, 0.0, ipAddress, deviceInfo,
                    "Session not active", System.currentTimeMillis() - startTime);
            throw new com.university.eventmanagement.exception.BadRequestException(
                    "Attendance scanning is not active for this event.");
        }

        if (!livenessPassed) {
            log.warn("Liveness check failed for scan at event {}", eventId);
            saveScanLog(event, null, AttendanceScanLog.ScanResult.LIVENESS_FAILED, 0.0, ipAddress, deviceInfo,
                    "Liveness check failed", System.currentTimeMillis() - startTime);
            throw new com.university.eventmanagement.exception.BadRequestException(
                    "Liveness check failed. Please ensure you are a real person.");
        }

        // Detect abnormal activity for this event/location
        auditService.detectAbnormalActivity(null, event); // System-wide for this event if no user yet

        if (!eventFaceCache.containsKey(eventId)) {
            refreshEventCache(eventId);
        }

        java.util.Map<Long, List<Float>> cachedEmbeddings = eventFaceCache.get(eventId);
        if (cachedEmbeddings == null || cachedEmbeddings.isEmpty()) {
            // This can happen if refreshEventCache found no users or event doesn't exist
            log.warn("No face data available for eventId: {}. Cache is empty or event not found.", eventId);
            throw new Exception("No face data available for this event. Have users registered?");
        }

        User bestMatch = null;
        double minDistance = Double.MAX_VALUE;

        // 2. Iterate through cached embeddings and find closest match
        for (java.util.Map.Entry<Long, List<Float>> entry : cachedEmbeddings.entrySet()) {
            Long userId = entry.getKey();
            List<Float> storedEmbedding = entry.getValue();

            double distance = calculateEuclideanDistance(inputEmbedding, storedEmbedding);

            if (distance < matchThreshold && distance < minDistance) {
                User user = userRepository.findById(Objects.requireNonNull(userId)).orElse(null);
                if (user != null && user.getStatus() != UserStatus.LOCKED) {
                    minDistance = distance;
                    bestMatch = user;
                }
            }
        }

        // Convert distance to confidence score (0.0 to 1.0)
        // Assuming max possible distance is around ~1.5 for normalized embeddings
        // e.g. if matchThreshold is 0.65, distance 0 = 100%, distance 0.65 = ~56%
        double confidenceScore = 1.0 - (minDistance / 1.5);
        if (confidenceScore < 0)
            confidenceScore = 0.0;
        if (confidenceScore > 1.0)
            confidenceScore = 1.0;

        if (bestMatch == null) {
            log.info("No match found for eventId: {}. Best distance was: {}. Verification took {}ms", eventId,
                    minDistance, (System.currentTimeMillis() - startTime));
            saveScanLog(event, null, AttendanceScanLog.ScanResult.NO_MATCH, confidenceScore, ipAddress, deviceInfo,
                    "Distance: " + minDistance, System.currentTimeMillis() - startTime);
            return Map.of("matched", false, "reason", "Face not recognized");
        } else {
            LocalDateTime now = LocalDateTime.now();
            java.util.Map<Long, LocalDateTime> eventScans = recentScansCache.computeIfAbsent(eventId,
                    k -> new java.util.concurrent.ConcurrentHashMap<>());
            LocalDateTime lastScan = eventScans.get(bestMatch.getId());

            if (lastScan != null && Duration.between(lastScan, now).toMinutes() < 5) {
                log.warn("Duplicate fast scan prevented for user {} at event {}. Verification took {}ms",
                        bestMatch.getEmail(), eventId, (System.currentTimeMillis() - startTime));
                saveScanLog(event, bestMatch, AttendanceScanLog.ScanResult.DUPLICATE, confidenceScore, ipAddress,
                        deviceInfo, "Fast duplicate scan", System.currentTimeMillis() - startTime);
                throw new com.university.eventmanagement.exception.BadRequestException(
                        "Duplicate scan: Please wait 5 minutes between scans.");
            }

            eventScans.put(bestMatch.getId(), now);

            // Reset failed attempts on success
            if (bestMatch.getFailedScanAttempts() != null && bestMatch.getFailedScanAttempts() > 0) {
                bestMatch.setFailedScanAttempts(0);
                userRepository.save(bestMatch);
            }

            log.info("Face match found: {} with distance: {}. Verification took {}ms", bestMatch.getEmail(),
                    minDistance, (System.currentTimeMillis() - startTime));

            // Abnormal activity for this specific user
            auditService.detectAbnormalActivity(bestMatch.getId(), event);

            saveScanLog(event, bestMatch, AttendanceScanLog.ScanResult.MATCHED, confidenceScore, ipAddress, deviceInfo,
                    "Distance: " + minDistance, System.currentTimeMillis() - startTime);

            return Map.of(
                    "matched", true,
                    "user", bestMatch,
                    "confidenceScore", confidenceScore);
        }
    }

    @Transactional
    public void handleFailedScan(Long userId) {
        if (userId == null)
            return;
        userRepository.findById(userId).ifPresent(user -> {
            int attempts = user.getFailedScanAttempts() != null ? user.getFailedScanAttempts() + 1 : 1;
            user.setFailedScanAttempts(attempts);
            if (attempts >= 5) {
                user.setStatus(UserStatus.LOCKED);
                log.warn("USER LOCKED: Too many failed face scan attempts for user {}", user.getEmail());
                saveAuditLog(user, "ACCOUNT_LOCKED", "Locked due to 5+ failed face scans", "SYSTEM");
            }
            userRepository.save(user);
        });
    }

    private void saveScanLog(Event event, User user, AttendanceScanLog.ScanResult result,
            double confidence, String ipAddress, String deviceInfo, String notes, Long latencyMs) {
        AttendanceScanLog log = AttendanceScanLog.builder()
                .event(event)
                .user(user)
                .result(result)
                .confidenceScore(confidence)
                .ipAddress(ipAddress)
                .deviceInfo(deviceInfo)
                .notes(notes)
                .latencyMs(latencyMs)
                .build();
        scanLogRepository.save(log);
    }

    private double calculateEuclideanDistance(List<Float> v1, List<Float> v2) {
        if (v1.size() != v2.size())
            return Double.MAX_VALUE;
        double sum = 0.0;
        for (int i = 0; i < v1.size(); i++) {
            sum += Math.pow(v1.get(i) - v2.get(i), 2);
        }
        return Math.sqrt(sum);
    }
}
