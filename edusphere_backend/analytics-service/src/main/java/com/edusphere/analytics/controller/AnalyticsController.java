package com.edusphere.analytics.controller;

import com.edusphere.analytics.dto.request.ProgressUpdateRequest;
import com.edusphere.analytics.dto.response.ApiResponse;
import com.edusphere.analytics.dto.response.KpiResponse;
import com.edusphere.analytics.dto.response.StudentProgressResponse;
import com.edusphere.analytics.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Analytics and student progress APIs")
@SecurityRequirement(name = "bearerAuth")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/kpis")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'COORDINATOR', 'ADMIN')")
    @Operation(summary = "Get platform KPIs — total courses, assignments, average score")
    public ResponseEntity<ApiResponse<KpiResponse>> getKpis(
            @RequestParam(required = false) String courseId,
            @RequestParam(required = false) String deptId) {
        KpiResponse kpis = analyticsService.getKpis(courseId, deptId);
        return ResponseEntity.ok(ApiResponse.success("KPIs retrieved successfully", kpis));
    }

    @PostMapping("/progress")
    @PreAuthorize("hasRole('SERVICE')")
    @Operation(summary = "Record a student progress event — called internally by assignment/course services")
    public ResponseEntity<ApiResponse<Void>> updateProgress(@RequestBody ProgressUpdateRequest request) {
        analyticsService.updateProgress(request);
        return ResponseEntity.ok(ApiResponse.success("Progress recorded", null));
    }

    @GetMapping("/progress/student/{studentId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'COORDINATOR', 'ADMIN', 'STUDENT')")
    @Operation(summary = "Get all progress events for a student")
    public ResponseEntity<ApiResponse<List<StudentProgressResponse>>> getStudentProgress(
            @PathVariable UUID studentId) {
        List<StudentProgressResponse> progress = analyticsService.getStudentProgress(studentId);
        return ResponseEntity.ok(ApiResponse.success(progress));
    }

    @GetMapping("/progress/course/{courseId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'COORDINATOR', 'ADMIN')")
    @Operation(summary = "Get all progress events for a course")
    public ResponseEntity<ApiResponse<List<StudentProgressResponse>>> getCourseProgress(
            @PathVariable UUID courseId) {
        List<StudentProgressResponse> progress = analyticsService.getCourseProgress(courseId);
        return ResponseEntity.ok(ApiResponse.success(progress));
    }

    @GetMapping("/progress/student/{studentId}/course/{courseId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'COORDINATOR', 'ADMIN', 'STUDENT')")
    @Operation(summary = "Get a student's progress events within a specific course")
    public ResponseEntity<ApiResponse<List<StudentProgressResponse>>> getStudentCourseProgress(
            @PathVariable UUID studentId,
            @PathVariable UUID courseId) {
        List<StudentProgressResponse> progress = analyticsService.getStudentCourseProgress(studentId, courseId);
        return ResponseEntity.ok(ApiResponse.success(progress));
    }
}
