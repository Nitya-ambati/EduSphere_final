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
@RequestMapping("/api/v1/instructors/{instructorId}/enrollments")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Enrollments")
public class InstructorEnrollmentController {

    private final EnrollmentService enrollmentService;

    @GetMapping
    @Operation(summary = "Get all course enrollments for an instructor",
            description = "Returns all active course enrollments for the given instructorId.")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getInstructorEnrollments(
            @PathVariable UUID instructorId) {
        List<EnrollmentResponse> enrollments = enrollmentService.getInstructorEnrollments(instructorId);
        return ResponseEntity.ok(ApiResponse.success("Instructor enrollments retrieved successfully", enrollments));
    }
}
