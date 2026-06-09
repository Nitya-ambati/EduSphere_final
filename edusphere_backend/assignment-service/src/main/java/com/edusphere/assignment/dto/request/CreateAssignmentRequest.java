package com.edusphere.assignment.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAssignmentRequest {

    private UUID courseId;

    @NotBlank(message = "Title is required")
    private String title;

    private String instructions;

    @Min(value = 1, message = "Time limit must be at least 1 minute")
    private int timeLimitMinutes;

    private LocalDateTime submissionDeadline;

    @Valid
    private List<QuestionRequest> questions;
}
