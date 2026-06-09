package com.edusphere.enrollment.controller;

import com.edusphere.enrollment.dto.request.EnrollRequest;
import com.edusphere.enrollment.dto.response.ApiResponse;
import com.edusphere.enrollment.dto.response.EnrollmentCheckDto;
import com.edusphere.enrollment.dto.response.EnrollmentResponse;
import com.edusphere.enrollment.service.EnrollmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/enrollments")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Enrollments", description = "Enroll students and instructors into courses, manage enrollment records")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR')")
    @Operation(summary = "Enroll a user (student or instructor) into a course",
            description = "Admin or Coordinator creates an enrollment. "
                    + "The user's department must match one of the course's linked departments unless isException=true.")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> enroll(
            @Valid @RequestBody EnrollRequest request) {
        EnrollmentResponse response = enrollmentService.enroll(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Enrollment created successfully", response));
    }

    @PostMapping("/self")
    @PreAuthorize("hasAnyRole('STUDENT', 'INSTRUCTOR')")
    @Operation(summary = "Self-enroll into a course",
            description = "Students and Instructors can enroll themselves. "
                    + "Department restrictions still apply. Send only courseId in the body.")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> selfEnroll(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole,
            @RequestParam UUID courseId) {
        EnrollmentResponse response = enrollmentService.selfEnroll(
                UUID.fromString(userId), userRole, courseId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Self-enrollment successful", response));
    }

    @PostMapping("/request")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Request enrollment into a course (Student)",
            description = "Student sends an enrollment request that requires coordinator approval.")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> requestEnrollment(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam UUID courseId) {
        EnrollmentResponse response = enrollmentService.requestEnrollment(UUID.fromString(userId), courseId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Enrollment request submitted", response));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR')")
    @Operation(summary = "Get all pending enrollment requests (Coordinator/Admin)")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getPendingRequests() {
        return ResponseEntity.ok(ApiResponse.success("Pending requests retrieved", enrollmentService.getPendingRequests()));
    }

    @PostMapping("/{enrollmentId}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR')")
    @Operation(summary = "Approve an enrollment request (Coordinator/Admin)")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> approve(@PathVariable UUID enrollmentId) {
        return ResponseEntity.ok(ApiResponse.success("Enrollment approved", enrollmentService.approveEnrollment(enrollmentId)));
    }

    @PostMapping("/{enrollmentId}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR')")
    @Operation(summary = "Reject an enrollment request (Coordinator/Admin)")
    public ResponseEntity<ApiResponse<Void>> reject(@PathVariable UUID enrollmentId) {
        enrollmentService.rejectEnrollment(enrollmentId);
        return ResponseEntity.ok(ApiResponse.success("Enrollment rejected", null));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR', 'INSTRUCTOR', 'SERVICE')")
    @Operation(summary = "Get all enrollments for a course",
            description = "Admin, Coordinator, Instructor and internal services can view enrollment records for a given courseId.")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getEnrollmentsByCourse(
            @RequestParam UUID courseId) {
        List<EnrollmentResponse> enrollments = enrollmentService.getEnrollmentsByCourse(courseId);
        return ResponseEntity.ok(ApiResponse.success("Enrollments retrieved successfully", enrollments));
    }

    @DeleteMapping("/{enrollmentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR')")
    @Operation(summary = "Remove an enrollment (soft delete)",
            description = "Admin can unenroll a user from a course. This is a soft-delete operation.")
    public ResponseEntity<ApiResponse<Void>> unenroll(@PathVariable UUID enrollmentId) {
        enrollmentService.unenroll(enrollmentId);
        return ResponseEntity.ok(ApiResponse.success("Enrollment removed successfully", null));
    }

    @PostMapping("/complete")
    @Operation(summary = "Mark a student's enrollment as COMPLETED (called by course-service on full content completion)")
    public ResponseEntity<ApiResponse<Void>> markComplete(
            @RequestParam UUID studentId,
            @RequestParam UUID courseId) {
        enrollmentService.markEnrollmentComplete(studentId, courseId);
        return ResponseEntity.ok(ApiResponse.success("Enrollment marked as completed", null));
    }

    @GetMapping("/check")
    @Operation(summary = "Check if a user is enrolled in a course",
            description = "Returns {enrolled: true/false}. Used internally by assignment-service and course-service to verify enrollment before allowing access.")
    public ResponseEntity<ApiResponse<EnrollmentCheckDto>> isEnrolled(
            @RequestParam UUID userId,
            @RequestParam UUID courseId) {
        boolean enrolled = enrollmentService.isEnrolled(userId, courseId);
        return ResponseEntity.ok(ApiResponse.success("Enrollment status retrieved", new EnrollmentCheckDto(enrolled)));
    }

    @GetMapping("/count")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get total enrollment count (Admin only)")
    public ResponseEntity<ApiResponse<Long>> getTotalEnrollmentCount() {
        long count = enrollmentService.getTotalEnrollmentCount();
        return ResponseEntity.ok(ApiResponse.success("Total enrollment count retrieved", count));
    }

    @GetMapping("/past")
    @PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR')")
    @Operation(summary = "Get all past (deleted/dropped) enrollments (Admin/Coordinator)",
            description = "Returns all soft-deleted enrollment records so admin or coordinator can view enrollment history.")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getPastEnrollments() {
        List<EnrollmentResponse> enrollments = enrollmentService.getDeletedEnrollments();
        return ResponseEntity.ok(ApiResponse.success("Past enrollments retrieved successfully", enrollments));
    }
}
