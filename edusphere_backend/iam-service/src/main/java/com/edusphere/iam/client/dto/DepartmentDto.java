package com.edusphere.iam.client.dto;

import lombok.Data;

import java.util.UUID;

/**
 * Slim DTO for the DepartmentResponse returned by course-service.
 * Used to resolve a department code into its UUID during user onboarding.
 */
@Data
public class DepartmentDto {
    private UUID departmentId;
    private String departmentName;
    private String departmentCode;
    private String description;
}
