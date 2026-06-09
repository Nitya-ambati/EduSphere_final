package com.edusphere.notification.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

    @NotNull(message = "studentId is required")
    private UUID studentId;

    @NotNull(message = "courseId is required")
    private UUID courseId;

    @NotBlank(message = "courseTitle is required")
    private String courseTitle;

    private String studentName;
}
