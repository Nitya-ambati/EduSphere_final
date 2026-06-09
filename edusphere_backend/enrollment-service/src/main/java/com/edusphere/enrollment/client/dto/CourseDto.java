package com.edusphere.enrollment.client.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CourseDto {
    private UUID courseId;
    private String courseName;
    private String courseCode;
    private boolean isActive;
    private boolean deleted;
    private List<UUID> departmentIds;
}
