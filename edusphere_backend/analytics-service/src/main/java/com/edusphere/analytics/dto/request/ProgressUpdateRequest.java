package com.edusphere.analytics.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressUpdateRequest {
    private UUID studentId;
    private UUID courseId;
    private UUID assignmentId;
    private UUID contentId;
    private Double score;
    private String eventType;
}
