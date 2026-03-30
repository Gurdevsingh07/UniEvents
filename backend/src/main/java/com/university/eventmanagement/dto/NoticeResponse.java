package com.university.eventmanagement.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class NoticeResponse {
    private Long id;
    private String title;
    private String content;
    private String attachmentUrl;
    private String noticeType;
    private Integer priority;
    private UserResponse createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private boolean isRead;
    private List<NoticeTargetResponse> targets;

    @Data
    @Builder
    public static class NoticeTargetResponse {
        private String targetType;
        private Long targetId;
    }
}
