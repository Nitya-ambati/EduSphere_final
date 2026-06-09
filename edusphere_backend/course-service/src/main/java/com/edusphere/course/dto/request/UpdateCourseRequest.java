package com.edusphere.course.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateCourseRequest {

    private String courseName;
    private String description;
    private String duration;
    private LocalDate enrollmentDeadline;
    private LocalDate completionDeadline;
    private Boolean isActive;
}
