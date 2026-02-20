package com.university.eventmanagement.dto;

import com.university.eventmanagement.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateUserRequest {

    @Size(min = 2, max = 100)
    private String fullName;

    @Email
    @Size(max = 150)
    private String email;

    @Size(max = 100)
    private String department;

    @Size(max = 15)
    private String phone;

    private Role role;
}
