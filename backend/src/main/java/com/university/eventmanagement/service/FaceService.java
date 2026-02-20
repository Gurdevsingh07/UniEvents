package com.university.eventmanagement.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.university.eventmanagement.model.*;
import com.university.eventmanagement.repository.FaceDataRepository;
import com.university.eventmanagement.repository.RegistrationRepository;
import com.university.eventmanagement.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
public class FaceService {

    @Autowired
    private FaceDataRepository faceDataRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RegistrationRepository registrationRepository;

    @Value("${app.face.match-threshold:0.65}")
    private double matchThreshold;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public void enrollFace(User user, List<Float> faceEmbedding) throws Exception {
        log.info("Enrolling face data for user ID: {}", user.getId());
        String embeddingJson = objectMapper.writeValueAsString(faceEmbedding);

        // Fetch existing or merge new
        FaceData faceData = faceDataRepository.findByUser(user)
                .orElseGet(() -> {
                    FaceData fd = new FaceData();
                    fd.setUser(user);
                    return fd;
                });

        faceData.setFaceEmbedding(embeddingJson);
        faceDataRepository.saveAndFlush(faceData);
        log.debug("FaceData record synchronized for user ID: {}", user.getId());

        // Update user status
        user.setFaceEnrolled(true);
        userRepository.saveAndFlush(user);
        log.info("Face enrollment status finalized for user: {}", user.getEmail());
    }

    @Transactional
    public User verifyFace(Long eventId, List<Float> inputEmbedding) throws Exception {
        log.debug("verifyFace called for eventId: {}", eventId);
        // 1. Get all registrations for the event
        List<Registration> registrations = registrationRepository.findByEventId(eventId);
        log.debug("Found {} registrations for eventId: {}", registrations.size(), eventId);

        User bestMatch = null;
        double minDistance = Double.MAX_VALUE;

        // 2. Iterate through registered users and compare face embeddings
        for (Registration reg : registrations) {
            User user = reg.getUser();
            try {
                if (!user.isFaceEnrolled())
                    continue;

                FaceData faceData = faceDataRepository.findByUser(user).orElse(null);
                if (faceData == null) {
                    log.warn("FaceData missing for presumably enrolled user: {}", user.getId());
                    continue;
                }

                String embeddingStr = faceData.getFaceEmbedding();
                if (embeddingStr == null || embeddingStr.isEmpty()) {
                    log.warn("FaceEmbedding string is empty for user: {}", user.getId());
                    continue;
                }

                List<Float> storedEmbedding = objectMapper.readValue(
                        embeddingStr,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, Float.class));

                double distance = calculateEuclideanDistance(inputEmbedding, storedEmbedding);
                log.trace("Distance for user {}: {}", user.getId(), distance);

                if (distance < matchThreshold && distance < minDistance) {
                    minDistance = distance;
                    bestMatch = user;
                    log.debug("New best match found: {} (dist: {})", user.getEmail(), distance);
                }
            } catch (Exception e) {
                log.error("Error processing user {}: {}", (user != null ? user.getId() : "null"), e.getMessage());
            }
        }

        if (bestMatch == null) {
            log.info("No match found for eventId: {}. Best distance was: {}", eventId, minDistance);
        } else {
            log.info("Face match found: {} with distance: {}", bestMatch.getEmail(), minDistance);
        }

        return bestMatch;
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
