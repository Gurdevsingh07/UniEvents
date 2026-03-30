package com.university.eventmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AppRoleResponse {
    private Long id;
    private String name;
    private String scope;
    private Set<String> permissions;
}
