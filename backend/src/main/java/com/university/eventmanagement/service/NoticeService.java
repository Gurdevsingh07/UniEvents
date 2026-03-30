package com.university.eventmanagement.service;

import com.university.eventmanagement.dto.NoticeRequest;
import com.university.eventmanagement.dto.NoticeResponse;
import com.university.eventmanagement.dto.UserResponse;
import com.university.eventmanagement.exception.ResourceNotFoundException;
import com.university.eventmanagement.model.*;
import com.university.eventmanagement.repository.NoticeReadStatusRepository;
import com.university.eventmanagement.repository.NoticeRepository;
import com.university.eventmanagement.repository.NoticeTargetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.university.eventmanagement.aspect.LogAudit;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final NoticeTargetRepository noticeTargetRepository;
    private final NoticeReadStatusRepository noticeReadStatusRepository;
    private final AuthService authService;

    @Transactional
    @LogAudit(action = "CREATE_NOTICE", entityType = "Notice", entityIdExpression = "#result.id")
    public NoticeResponse createNotice(NoticeRequest request) {
        User currentUser = authService.getCurrentUser();

        Notice notice = Notice.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .attachmentUrl(request.getAttachmentUrl())
                .noticeType(request.getNoticeType())
                .priority(request.getPriority() != null ? request.getPriority() : 3)
                .expiresAt(request.getExpiresAt())
                .createdBy(currentUser)
                .build();

        notice = noticeRepository.save(notice);

        if (request.getTargets() != null) {
            for (NoticeRequest.NoticeTargetRequest tr : request.getTargets()) {
                NoticeTarget target = NoticeTarget.builder()
                        .notice(notice)
                        .targetType(tr.getTargetType())
                        .targetId(tr.getTargetId())
                        .build();
                notice.getTargets().add(target);
            }
        }

        noticeTargetRepository.saveAll(notice.getTargets());
        return mapToResponse(notice, currentUser);
    }

    @Transactional(readOnly = true)
    public List<NoticeResponse> getVisibleNotices() {
        User user = authService.getCurrentUser();

        Long deptId = user.getDepartment() != null ? user.getDepartment().getId() : null;

        List<Notice> baseNotices = noticeRepository.findBaseVisibleNotices(deptId);

        // TODO: get user's club and event registrations
        // For now, return base notices
        List<Notice> visibleNotices = baseNotices;

        return visibleNotices.stream()
                .map(n -> mapToResponse(n, user))
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long noticeId) {
        User user = authService.getCurrentUser();
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new ResourceNotFoundException("Notice not found"));

        if (!noticeReadStatusRepository.existsByNoticeAndUser(notice, user)) {
            noticeReadStatusRepository.save(NoticeReadStatus.builder()
                    .notice(notice)
                    .user(user)
                    .build());
        }
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        User user = authService.getCurrentUser();
        List<Notice> visibleNotices = getVisibleNoticesBase();

        long count = 0;
        for (Notice n : visibleNotices) {
            if (!noticeReadStatusRepository.existsByNoticeAndUser(n, user)) {
                count++;
            }
        }
        return count;
    }

    private List<Notice> getVisibleNoticesBase() {
        User user = authService.getCurrentUser();
        Long deptId = user.getDepartment() != null ? user.getDepartment().getId() : null;
        return noticeRepository.findBaseVisibleNotices(deptId);
    }

    private NoticeResponse mapToResponse(Notice notice, User user) {
        boolean isRead = user != null && noticeReadStatusRepository.existsByNoticeAndUser(notice, user);

        List<NoticeResponse.NoticeTargetResponse> targets = notice.getTargets().stream()
                .map(t -> NoticeResponse.NoticeTargetResponse.builder()
                        .targetType(t.getTargetType().name())
                        .targetId(t.getTargetId())
                        .build())
                .collect(Collectors.toList());

        return NoticeResponse.builder()
                .id(notice.getId())
                .title(notice.getTitle())
                .content(notice.getContent())
                .attachmentUrl(notice.getAttachmentUrl())
                .noticeType(notice.getNoticeType().name())
                .priority(notice.getPriority())
                .createdBy(UserResponse.builder()
                        .id(notice.getCreatedBy().getId())
                        .fullName(notice.getCreatedBy().getFullName())
                        .build())
                .createdAt(notice.getCreatedAt())
                .expiresAt(notice.getExpiresAt())
                .isRead(isRead)
                .targets(targets)
                .build();
    }
}
