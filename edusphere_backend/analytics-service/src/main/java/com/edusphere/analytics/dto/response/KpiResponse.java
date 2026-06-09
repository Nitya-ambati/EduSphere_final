package com.edusphere.analytics.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KpiResponse {

    private long totalStudents;
    private long totalCourses;
    private long totalAssignments;
    private double averageScore;
    private double passRate;
    private double averageAttendance;
    private String reportedFor;
}
