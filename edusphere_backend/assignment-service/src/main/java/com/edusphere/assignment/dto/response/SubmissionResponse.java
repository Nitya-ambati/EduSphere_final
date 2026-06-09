package com.edusphere.assignment.dto.response;

import com.edusphere.assignment.enums.SubmissionStatus;
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
public class SubmissionResponse {

    private UUID submissionId;
    private UUID assignmentId;
    private UUID studentId;
    private LocalDateTime submittedAt;
    private long timeTakenSeconds;
    private Double score;
    private Integer totalQuestions;
    private Integer correctAnswers;
    private SubmissionStatus status;
}
