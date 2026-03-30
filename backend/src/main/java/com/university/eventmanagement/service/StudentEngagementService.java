package com.university.eventmanagement.service;

import com.university.eventmanagement.model.StudentEngagement;
import com.university.eventmanagement.model.User;
import com.university.eventmanagement.repository.StudentEngagementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class StudentEngagementService {

    private final StudentEngagementRepository engagementRepository;

    @Transactional
    public StudentEngagement getOrCreateEngagement(User user) {
        return engagementRepository.findByUser(user)
                .orElseGet(() -> {
                    StudentEngagement se = StudentEngagement.builder().user(user).build();
                    return engagementRepository.save(Objects.requireNonNull(se));
                });
    }

    @Transactional
    public void recordRegistration(User user) {
        StudentEngagement se = getOrCreateEngagement(user);
        se.setTotalRegistered(se.getTotalRegistered() + 1);
        calculateScore(se);
        engagementRepository.save(se);
    }

    @Transactional
    public void recordCancellation(User user) {
        StudentEngagement se = getOrCreateEngagement(user);
        se.setTotalCancelled(se.getTotalCancelled() + 1);
        calculateScore(se);
        engagementRepository.save(se);
    }

    @Transactional
    public void recordAttendance(User user) {
        StudentEngagement se = getOrCreateEngagement(user);
        se.setTotalAttended(se.getTotalAttended() + 1);
        calculateScore(se);
        engagementRepository.save(se);
    }

    @Transactional
    public void recordNoShow(User user) {
        StudentEngagement se = getOrCreateEngagement(user);
        se.setNoShowCount(se.getNoShowCount() + 1);
        calculateScore(se);
        engagementRepository.save(se);
    }

    private void calculateScore(StudentEngagement se) {
        int expectedToAttend = se.getTotalRegistered() - se.getTotalCancelled();
        if (expectedToAttend <= 0) {
            se.setEngagementScore(0.0f);
            return;
        }

        float attendanceRate = (float) se.getTotalAttended() / expectedToAttend;
        float penalty = se.getNoShowCount() * 0.1f; // 10% penalty per no-show

        float score = (attendanceRate * 100) - (penalty * 100);
        if (score < 0)
            score = 0;
        if (score > 100)
            score = 100;

        se.setEngagementScore(score);
    }
}
