package com.edusphere.assignment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentResponse {

    private UUID assignmentId;
    private UUID courseId;
    private String title;
    private String instructions;
    private int timeLimitMinutes;
    private LocalDateTime submissionDeadline;
    private UUID createdBy;
    private boolean isActive;
    private int questionCount;
}
