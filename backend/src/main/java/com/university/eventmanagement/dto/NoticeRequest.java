package com.university.eventmanagement.dto;

import com.university.eventmanagement.model.NoticeType;
import com.university.eventmanagement.model.TargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class NoticeRequest {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Content is required")
    private String content;

    private String attachmentUrl;

    @NotNull(message = "Notice type is required")
    private NoticeType noticeType;

    private Integer priority;

    private LocalDateTime expiresAt;

    private List<NoticeTargetRequest> targets;

    @Data
    public static class NoticeTargetRequest {
        @NotNull(message = "Target type is required")
        private TargetType targetType;
        private Long targetId;
    }
}
