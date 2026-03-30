package com.university.eventmanagement.service;

import com.university.eventmanagement.model.AuditLog;
import com.university.eventmanagement.model.Event;
import com.university.eventmanagement.repository.AttendanceScanLogRepository;
import com.university.eventmanagement.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final AttendanceScanLogRepository scanLogRepository;

    @Async
    public void logAction(Long userId, String action, String entityType, Long entityId, String metadata) {
        try {
            String ipAddress = null;
            if (RequestContextHolder.getRequestAttributes() != null) {
                HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes())
                        .getRequest();
                ipAddress = request.getRemoteAddr();
                // Handle reverse proxies if needed (X-Forwarded-For)
                String xfHeader = request.getHeader("X-Forwarded-For");
                if (xfHeader != null && !xfHeader.isEmpty()) {
                    ipAddress = xfHeader.split(",")[0];
                }
            }

            AuditLog auditLog = AuditLog.builder()
                    .userId(userId)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .metadata(metadata)
                    .ipAddress(ipAddress)
                    .build();

            auditLogRepository.save(auditLog);
            log.debug("Audit log saved: Action={}, EntityType={}, EntityId={}", action, entityType, entityId);
        } catch (Exception e) {
            log.error("Failed to save audit log: {}", e.getMessage(), e);
        }
    }

    public void detectAbnormalActivity(Long userId, Event event) {
        if (userId == null || event == null)
            return;

        java.time.LocalDateTime since = java.time.LocalDateTime.now().minusMinutes(1);
        long recentScans = scanLogRepository.countByEventAndUserIdAndScannedAtAfter(event, userId, since);

        if (recentScans > 10) {
            log.warn("ABNORMAL ACTIVITY DETECTED: User {} has {} scan attempts in the last minute for event {}",
                    userId, recentScans, event.getId());
            logAction(userId, "ABNORMAL_SCAN_ACTIVITY", "Event", event.getId(),
                    "Detected " + recentScans + " scans in 1 minute");
        }
    }
}
