package com.university.eventmanagement.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String fullName;
    private String email;
    private String studentId;
    private String department;
    private String phone;
    private String role;
    private String profilePicture;
    private String createdAt;
    private List<String> permissions;
}
