package com.university.eventmanagement.controller;

import com.university.eventmanagement.dto.ApiResponse;
import com.university.eventmanagement.model.AuditLog;
import com.university.eventmanagement.repository.AuditLogRepository;
import com.university.eventmanagement.security.RequiresPermission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.lang.NonNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@Tag(name = "Audit Logs", description = "Endpoints for viewing system audit logs")
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    @RequiresPermission("VIEW_REPORTS") // Or a dedicated VIEW_AUDIT_LOGS permission
    @Operation(summary = "Get paginated audit logs")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getAuditLogs(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long entityId,
            @PageableDefault(sort = "timestamp", direction = Sort.Direction.DESC, size = 20) @NonNull Pageable pageable) {

        Page<AuditLog> page;

        if (userId != null) {
            page = auditLogRepository.findByUserId(userId, pageable);
        } else if (action != null) {
            page = auditLogRepository.findByAction(action, pageable);
        } else if (entityType != null && entityId != null) {
            page = auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId, pageable);
        } else {
            page = auditLogRepository.findAll(pageable);
        }

        return ResponseEntity.ok(ApiResponse.success(page));
    }
}
