package com.edusphere.course.dto.request;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class CreateCourseRequest {

    private String courseName;
    private String courseCode;
    private String description;
    private String duration;
    private LocalDate enrollmentDeadline;
    private LocalDate completionDeadline;
    private List<UUID> departmentIds;
}
