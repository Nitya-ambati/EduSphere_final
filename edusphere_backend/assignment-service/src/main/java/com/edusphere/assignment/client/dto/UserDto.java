package com.edusphere.assignment.client.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class UserDto {
    private UUID userId;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private UUID departmentId;
    private boolean active;
}
