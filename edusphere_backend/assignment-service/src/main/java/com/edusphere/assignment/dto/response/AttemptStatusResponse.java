package com.edusphere.assignment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttemptStatusResponse {
    private UUID assignmentId;
    private List<StudentAttemptInfo> attempted;
    private List<UUID> notAttempted;
    private int totalEnrolled;
    private int totalAttempted;
    private int totalNotAttempted;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentAttemptInfo {
        private UUID studentId;
        private UUID submissionId;
        private Double score;
        private java.time.LocalDateTime submittedAt;
    }
}
