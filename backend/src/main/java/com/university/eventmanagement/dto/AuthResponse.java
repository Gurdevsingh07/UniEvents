package com.university.eventmanagement.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    @Builder.Default
    private String type = "Bearer";
    private Long id;
    private String fullName;
    private String email;
    private String role;
    private String studentId;
    private String profilePicture;
    private List<String> permissions;
}
