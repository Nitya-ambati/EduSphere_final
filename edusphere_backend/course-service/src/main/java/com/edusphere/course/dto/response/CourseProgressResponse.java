package com.edusphere.course.dto.response;

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
public class CourseProgressResponse {

    private UUID studentId;
    private UUID courseId;
    private int totalContents;
    private int completedContents;
    private double progressPercentage;
    private List<UUID> completedContentIds;
}
