package com.edusphere.enrollment.controller;

import com.edusphere.enrollment.dto.response.ApiResponse;
import com.edusphere.enrollment.dto.response.EnrollmentResponse;
import com.edusphere.enrollment.service.EnrollmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/students/{studentId}/enrollments")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Enrollments")
public class StudentEnrollmentController {

    private final EnrollmentService enrollmentService;

    @GetMapping
    @Operation(summary = "Get all active course enrollments for a student")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getStudentEnrollments(
            @PathVariable UUID studentId) {
        List<EnrollmentResponse> enrollments = enrollmentService.getStudentEnrollments(studentId);
        return ResponseEntity.ok(ApiResponse.success("Student enrollments retrieved successfully", enrollments));
    }

    @GetMapping("/pending")
    @Operation(summary = "Get pending enrollment requests for a student")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getStudentPendingRequests(
            @PathVariable UUID studentId) {
        List<EnrollmentResponse> requests = enrollmentService.getStudentPendingRequests(studentId);
        return ResponseEntity.ok(ApiResponse.success("Pending requests retrieved", requests));
    }
}
