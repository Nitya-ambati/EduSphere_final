package com.edusphere.course.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseCompletionNotificationRequest {
    private UUID studentId;
    private UUID courseId;
    private String courseTitle;
    private String studentName;
}
