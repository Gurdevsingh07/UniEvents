package com.university.eventmanagement.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamMemberResponse {
    private Long id;
    private String fullName;
    private String email;
    private String studentId;
    private String department;
    private List<String> roles;
    private String status;
    private boolean readOnly; // true for organizers — prevents editing
}
