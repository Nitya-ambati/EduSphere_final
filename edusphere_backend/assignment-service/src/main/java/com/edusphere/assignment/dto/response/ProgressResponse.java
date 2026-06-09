package com.edusphere.assignment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgressResponse {

    private UUID studentId;
    private int totalAssignments;
    private int submittedAssignments;
    private Double averageScore;
    private Double bestScore;
    private List<SubmissionResponse> submissions;
}
