package com.edusphere.assignment.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAssignmentRequest {
    private String title;
    private String instructions;
    private Integer timeLimitMinutes;
    private LocalDateTime submissionDeadline;
}
