package com.edusphere.analytics.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentProgressResponse {
    private UUID progressId;
    private UUID studentId;
    private UUID courseId;
    private UUID assignmentId;
    private UUID contentId;
    private String eventType;
    private Double score;
    private LocalDateTime eventTimestamp;
}
