package com.university.eventmanagement.controller;

import com.university.eventmanagement.dto.ApiResponse;
import com.university.eventmanagement.dto.NoticeRequest;
import com.university.eventmanagement.dto.NoticeResponse;
import com.university.eventmanagement.security.RequiresPermission;
import com.university.eventmanagement.service.NoticeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
@Tag(name = "Notice Board", description = "Notice Governance Engine endpoints")
public class NoticeController {

    private final NoticeService noticeService;

    @GetMapping
    @Operation(summary = "Get all visible notices for the current user")
    public ResponseEntity<ApiResponse<List<NoticeResponse>>> getVisibleNotices() {
        return ResponseEntity.ok(ApiResponse.success(noticeService.getVisibleNotices()));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notice count for badge")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        return ResponseEntity.ok(ApiResponse.success(noticeService.getUnreadCount()));
    }

    @PostMapping
    @RequiresPermission("CREATE_NOTICE")
    @Operation(summary = "Create a new notice")
    public ResponseEntity<ApiResponse<NoticeResponse>> createNotice(@Valid @RequestBody NoticeRequest request) {
        return ResponseEntity
                .ok(ApiResponse.success("Notice created successfully", noticeService.createNotice(request)));
    }

    @PostMapping("/{id}/read")
    @Operation(summary = "Mark a notice as read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        noticeService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Notice marked as read", null));
    }
}
