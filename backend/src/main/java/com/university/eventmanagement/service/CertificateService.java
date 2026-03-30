package com.university.eventmanagement.service;

import com.university.eventmanagement.dto.CertificateResponse;
import com.university.eventmanagement.exception.BadRequestException;
import com.university.eventmanagement.exception.ResourceNotFoundException;
import com.university.eventmanagement.model.*;
import com.university.eventmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CertificateService {

  private final CertificateRepository certificateRepository;
  private final AuthService authService;

  private static final String CERT_DIR = "uploads/certificates/";
  private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MMMM dd, yyyy");

  /**
   * Generates an HTML-based certificate file and stores metadata for the given
   * user/event.
   */
  public Certificate generateCertificate(User user, Event event) throws IOException {
    // Don't generate duplicate
    if (certificateRepository.existsByUserAndEvent(user, event)) {
      return certificateRepository.findByUserAndEvent(user, event).orElseThrow();
    }

    // Ensure directory exists
    Path certDirPath = Paths.get(CERT_DIR);
    Files.createDirectories(certDirPath);

    String fileName = "cert_" + user.getId() + "_" + event.getId() + "_" + UUID.randomUUID() + ".html";
    String filePath = CERT_DIR + fileName;

    String html = buildCertificateHtml(user, event);
    try (FileWriter fw = new FileWriter(filePath)) {
      fw.write(html);
    }

    Certificate cert = Certificate.builder()
        .user(user)
        .event(event)
        .filePath(filePath)
        .build();

    Certificate saved = certificateRepository.save(cert);
    log.info("Certificate generated for user {} event {}: {}", user.getId(), event.getId(), filePath);
    return saved;
  }

  /**
   * Checks if a certificate already exists for user/event pair.
   */
  public boolean existsCertificate(User user, Event event) {
    return certificateRepository.existsByUserAndEvent(user, event);
  }

  /**
   * Returns certificate list for the current user.
   */
  @Transactional(readOnly = true)
  public List<CertificateResponse> getMyCertificates() {
    User currentUser = authService.getCurrentUser();
    return certificateRepository.findByUserOrderByIssuedAtDesc(currentUser).stream()
        .map(this::mapToResponse)
        .collect(Collectors.toList());
  }

  /**
   * Gets the certificate file bytes by download token.
   * Increments download counter.
   */
  public byte[] downloadCertificate(String token) throws IOException {
    Certificate cert = certificateRepository.findByDownloadToken(token)
        .orElseThrow(() -> new ResourceNotFoundException("Certificate not found or invalid token"));

    // Verify the current user owns this certificate
    User currentUser = authService.getCurrentUser();
    if (!cert.getUser().getId().equals(currentUser.getId())) {
      throw new BadRequestException("You are not authorized to download this certificate");
    }

    Path path = Paths.get(cert.getFilePath());
    if (!Files.exists(path)) {
      throw new ResourceNotFoundException("Certificate file not found on server");
    }

    cert.setDownloadCount(cert.getDownloadCount() + 1);
    cert.setDownloadedAt(java.time.LocalDateTime.now());
    certificateRepository.save(cert);

    return Files.readAllBytes(path);
  }

  private CertificateResponse mapToResponse(Certificate cert) {
    return CertificateResponse.builder()
        .id(cert.getId())
        .eventId(cert.getEvent().getId())
        .eventTitle(cert.getEvent().getTitle())
        .eventDate(cert.getEvent().getEventDate() != null
            ? cert.getEvent().getEventDate().format(DATE_FMT)
            : "")
        .issuedAt(cert.getIssuedAt())
        .downloadToken(cert.getDownloadToken())
        .downloadCount(cert.getDownloadCount())
        .build();
  }

  private String buildCertificateHtml(User user, Event event) {
    String eventDate = event.getEventDate() != null
        ? event.getEventDate().format(DATE_FMT)
        : "the event";
    String issuedDate = java.time.LocalDate.now().format(DATE_FMT);

    return """
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <title>Certificate of Attendance</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Lato:wght@300;400&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Lato', sans-serif; background: #f8f6f0; display: flex;
                 justify-content: center; align-items: center; min-height: 100vh; }
          .cert { width: 900px; min-height: 630px; background: #fff;
                  border: 3px solid #8b6914; box-shadow: 0 0 0 10px #f0e6c4, 0 0 0 13px #8b6914;
                  padding: 60px 80px; text-align: center; position: relative; }
          .cert::before { content: ''; position: absolute; top: 20px; left: 20px; right: 20px; bottom: 20px;
                          border: 1px solid #d4a843; pointer-events: none; }
          h1 { font-family: 'Cinzel', serif; font-size: 42px; color: #8b6914; margin-bottom: 4px; }
          .subtitle { font-family: 'Cinzel', serif; font-size: 14px; letter-spacing: 4px;
                      color: #a08030; text-transform: uppercase; margin-bottom: 40px; }
          .text { font-size: 18px; color: #555; margin-bottom: 10px; }
          .name { font-family: 'Cinzel', serif; font-size: 36px; color: #2c3e50;
                  border-bottom: 2px solid #d4a843; display: inline-block;
                  padding: 0 40px 8px; margin: 16px 0 24px; }
          .event { font-size: 22px; font-weight: bold; color: #8b6914; margin-bottom: 8px; }
          .date { font-size: 16px; color: #777; margin-bottom: 40px; }
          .footer { display: flex; justify-content: space-around; margin-top: 50px; }
          .sig { text-align: center; }
          .sig-line { width: 160px; border-top: 1px solid #333; margin: 0 auto 6px; }
          .sig-label { font-size: 13px; color: #666; letter-spacing: 1px; }
          .seal { width: 80px; height: 80px; border-radius: 50%; background: #8b6914;
                  color: #fff; display: flex; align-items: center; justify-content: center;
                  font-family: 'Cinzel', serif; font-size: 11px; text-align: center;
                  line-height: 1.4; margin: 0 auto 6px; }
        </style>
        </head>
        <body>
        <div class="cert">
          <h1>Certificate</h1>
          <div class="subtitle">of Attendance</div>
          <p class="text">This is to certify that</p>
          <div class="name">"""
        + escapeHtml(user.getFullName()) + """
            </div>
              <p class="text">has successfully attended the event</p>
              <p class="event">""" + escapeHtml(event.getTitle()) + """
            </p>
              <p class="date">held on """ + eventDate + """
            </p>
              <div class="footer">
                <div class="sig">
                  <div class="sig-line"></div>
                  <div class="sig-label">Event Organizer</div>
                </div>
                <div class="sig">
                  <div class="seal">UNI<br>EVENTS</div>
                  <div class="sig-label">Official Seal</div>
                </div>
                <div class="sig">
                  <div class="sig-line"></div>
                  <div class="sig-label">Issued: """ + issuedDate + """
            </div>
                </div>
              </div>
            </div>
            </body>
            </html>
            """;
  }

  private String escapeHtml(String input) {
    if (input == null)
      return "";
    return input.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
  }
}
