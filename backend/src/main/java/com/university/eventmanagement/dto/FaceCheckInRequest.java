package com.university.eventmanagement.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FaceCheckInRequest {
    private List<Float> embedding;
    private String sessionToken;
    private boolean livenessPassed = true; // default true for backwards compatibility
}
