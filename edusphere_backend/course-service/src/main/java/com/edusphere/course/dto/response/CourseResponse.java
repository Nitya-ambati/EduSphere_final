package com.edusphere.course.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse {

    private UUID courseId;
    private String courseName;
    private String courseCode;
    private String description;
    private String duration;
    private LocalDate enrollmentDeadline;
    private LocalDate completionDeadline;
    private boolean isActive;
    private List<UUID> departmentIds;
}
