package com.university.eventmanagement.controller;

import com.university.eventmanagement.dto.CertificateResponse;
import com.university.eventmanagement.service.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    /**
     * Returns a list of certificates for the currently logged-in student.
     */
    @GetMapping("/my")
    public ResponseEntity<List<CertificateResponse>> getMyCertificates() {
        return ResponseEntity.ok(certificateService.getMyCertificates());
    }

    /**
     * Downloads a certificate file by its secure download token.
     * Returns the HTML file as text/html for browser display.
     */
    @GetMapping("/download/{token}")
    public ResponseEntity<byte[]> downloadCertificate(@PathVariable String token) throws IOException {
        byte[] fileBytes = certificateService.downloadCertificate(token);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/html"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"certificate.html\"")
                .body(fileBytes);
    }
}
