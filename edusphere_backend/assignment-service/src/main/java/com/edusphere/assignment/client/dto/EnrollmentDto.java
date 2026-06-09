package com.edusphere.assignment.client.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentDto {
    private UUID enrollmentId;
    private UUID userId;
    private UUID courseId;
    private String userRole;
    private String status;
}
