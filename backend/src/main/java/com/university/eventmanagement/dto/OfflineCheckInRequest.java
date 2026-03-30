package com.university.eventmanagement.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OfflineCheckInRequest {
    private List<OfflineCheckIn> checkIns;

    @Data
    public static class OfflineCheckIn {
        private String studentId;
        private LocalDateTime scannedAt;
    }
}
