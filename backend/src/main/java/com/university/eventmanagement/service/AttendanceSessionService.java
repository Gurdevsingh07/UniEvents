package com.university.eventmanagement.service;

import com.university.eventmanagement.exception.BadRequestException;
import com.university.eventmanagement.exception.ResourceNotFoundException;
import com.university.eventmanagement.model.*;
import com.university.eventmanagement.model.AttendanceSession.SessionStatus;
import com.university.eventmanagement.repository.AttendanceSessionRepository;
import com.university.eventmanagement.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AttendanceSessionService {

        private final AttendanceSessionRepository sessionRepository;
        private final EventRepository eventRepository;
        private final AuthService authService;
        private final org.springframework.context.ApplicationContext applicationContext;

        private FaceService getFaceService() {
                return applicationContext.getBean(FaceService.class);
        }

        /**
         * Starts a new attendance scanning session for the given event.
         * Only one ACTIVE session per event at a time is allowed.
         */
        public Map<String, Object> startSession(Long eventId) {
                User currentUser = authService.getCurrentUser();
                Event event = getEvent(eventId);

                // Check for already active session
                Optional<AttendanceSession> existing = sessionRepository
                                .findTopByEventIdAndStatusOrderByCreatedAtDesc(eventId, SessionStatus.ACTIVE);
                if (existing.isPresent()) {
                        throw new BadRequestException("An active scanning session already exists for this event. " +
                                        "Token: " + existing.get().getSessionToken());
                }

                // Pre-load face embeddings into cache
                getFaceService().refreshEventCache(eventId);

                AttendanceSession session = AttendanceSession.builder()
                                .event(event)
                                .startedBy(currentUser)
                                .status(SessionStatus.ACTIVE)
                                .startedAt(LocalDateTime.now())
                                .build();

                AttendanceSession saved = sessionRepository.save(session);
                log.info("Attendance session started for event {} by user {}. Token: {}",
                                eventId, currentUser.getId(), saved.getSessionToken());

                return Map.of(
                                "sessionToken", saved.getSessionToken(),
                                "status", saved.getStatus().name(),
                                "eventId", eventId,
                                "startedAt", saved.getStartedAt().toString());
        }

        /**
         * Pauses the active session for the given event.
         */
        public Map<String, Object> pauseSession(Long eventId) {
                AttendanceSession session = getActiveSession(eventId);
                session.setStatus(SessionStatus.PAUSED);
                session.setPausedAt(LocalDateTime.now());
                sessionRepository.save(session);
                log.info("Attendance session paused for event {}", eventId);
                return buildStatusResponse(session);
        }

        /**
         * Resumes a paused session for the given event.
         */
        public Map<String, Object> resumeSession(Long eventId) {
                AttendanceSession session = sessionRepository
                                .findTopByEventIdAndStatusOrderByCreatedAtDesc(eventId, SessionStatus.PAUSED)
                                .orElseThrow(() -> new BadRequestException("No paused session found for this event."));
                session.setStatus(SessionStatus.ACTIVE);
                session.setPausedAt(null);
                sessionRepository.save(session);
                log.info("Attendance session resumed for event {}", eventId);
                return buildStatusResponse(session);
        }

        /**
         * Closes the active/paused session and invalidates face cache.
         */
        public Map<String, Object> closeSession(Long eventId) {
                AttendanceSession session = sessionRepository
                                .findTopByEventIdOrderByCreatedAtDesc(eventId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "No session found for event " + eventId));
                session.setStatus(SessionStatus.CLOSED);
                session.setClosedAt(LocalDateTime.now());
                sessionRepository.save(session);
                getFaceService().invalidateCache(eventId);
                log.info("Attendance session closed for event {}", eventId);
                return buildStatusResponse(session);
        }

        /**
         * Returns current session status for the event.
         */
        @Transactional(readOnly = true)
        public Map<String, Object> getSessionStatus(Long eventId) {
                Optional<AttendanceSession> session = sessionRepository
                                .findTopByEventIdOrderByCreatedAtDesc(eventId);
                if (session.isEmpty()) {
                        return Map.of("status", "NO_SESSION", "eventId", eventId);
                }
                return buildStatusResponse(session.get());
        }

        /**
         * Checks if scanning is allowed for a given event.
         * Returns true only if an ACTIVE session exists.
         */
        @Transactional(readOnly = true)
        public boolean isScanningAllowed(Long eventId) {
                return sessionRepository.findTopByEventIdAndStatusOrderByCreatedAtDesc(eventId, SessionStatus.ACTIVE)
                                .isPresent();
        }

        private AttendanceSession getActiveSession(Long eventId) {
                return sessionRepository
                                .findTopByEventIdAndStatusOrderByCreatedAtDesc(eventId, SessionStatus.ACTIVE)
                                .orElseThrow(() -> new BadRequestException(
                                                "No active scanning session for this event. " +
                                                                "Please start a session first."));
        }

        private Event getEvent(Long eventId) {
                return eventRepository.findById(eventId)
                                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));
        }

        private Map<String, Object> buildStatusResponse(AttendanceSession session) {
                return Map.of(
                                "sessionId", session.getId(),
                                "sessionToken", session.getSessionToken(),
                                "status", session.getStatus().name(),
                                "eventId", session.getEvent().getId(),
                                "startedAt", session.getStartedAt().toString());
        }
}
