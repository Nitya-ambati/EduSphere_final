package com.edusphere.analytics.service;

import com.edusphere.analytics.dto.request.GenerateReportRequest;
import com.edusphere.analytics.dto.request.ProgressUpdateRequest;
import com.edusphere.analytics.dto.response.KpiResponse;
import com.edusphere.analytics.dto.response.ReportResponse;
import com.edusphere.analytics.dto.response.StudentProgressResponse;

import java.util.List;
import java.util.UUID;

public interface AnalyticsService {

    KpiResponse getKpis(String courseId, String deptId);

    ReportResponse generateReport(GenerateReportRequest request, UUID generatedBy);

    List<ReportResponse> listReports(UUID requesterId);

    ReportResponse getReport(UUID reportId);

    void updateProgress(ProgressUpdateRequest request);

    List<StudentProgressResponse> getStudentProgress(UUID studentId);

    List<StudentProgressResponse> getCourseProgress(UUID courseId);

    List<StudentProgressResponse> getStudentCourseProgress(UUID studentId, UUID courseId);
}
