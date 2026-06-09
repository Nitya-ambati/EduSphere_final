package com.edusphere.assignment.controller;

import com.edusphere.assignment.dto.request.CreateAssignmentRequest;
import com.edusphere.assignment.dto.request.SubmitAssignmentRequest;
import com.edusphere.assignment.dto.request.UpdateAssignmentRequest;
import com.edusphere.assignment.dto.response.ApiResponse;
import com.edusphere.assignment.dto.response.AssignmentDetailResponse;
import com.edusphere.assignment.dto.response.AssignmentResponse;
import com.edusphere.assignment.dto.response.AttemptStatusResponse;
import com.edusphere.assignment.dto.response.SubmissionDetailResponse;
import com.edusphere.assignment.dto.response.SubmissionResponse;
import com.edusphere.assignment.service.AssignmentService;
import com.edusphere.assignment.service.SubmissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Tag(name = "Assignment", description = "Assignment and submission management APIs")
@SecurityRequirement(name = "bearerAuth")
public class AssignmentController {

    private final AssignmentService assignmentService;
    private final SubmissionService submissionService;

    @PostMapping("/api/v1/courses/{courseId}/assignments")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    @Operation(summary = "Create assignment for a course")
    public ResponseEntity<ApiResponse<AssignmentResponse>> createAssignment(
            @PathVariable UUID courseId,
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody CreateAssignmentRequest request) {

        request.setCourseId(courseId);
        UUID instructorId = UUID.fromString(userId);
        AssignmentResponse response = assignmentService.createAssignment(request, instructorId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Assignment created successfully", response));
    }

    @GetMapping("/api/v1/courses/{courseId}/assignments")
    @PreAuthorize("hasAnyRole('STUDENT', 'INSTRUCTOR', 'ADMIN', 'COORDINATOR')")
    @Operation(summary = "Get all assignments for a course — requester must be enrolled (ADMIN/COORDINATOR bypass)")
    public ResponseEntity<ApiResponse<List<AssignmentResponse>>> getAssignmentsByCourse(
            @PathVariable UUID courseId,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {

        if ("ADMIN".equalsIgnoreCase(userRole) || "COORDINATOR".equalsIgnoreCase(userRole)) {
            List<AssignmentResponse> assignments = assignmentService.getAssignmentsByCourseForSupervisor(courseId);
            return ResponseEntity.ok(ApiResponse.success(assignments));
        }
        List<AssignmentResponse> assignments = assignmentService.getAssignmentsByCourse(courseId, UUID.fromString(userId));
        return ResponseEntity.ok(ApiResponse.success(assignments));
    }

    @GetMapping("/api/v1/coordinator/courses/{courseId}/assignments")
    @PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR')")
    @Operation(summary = "Get all assignments for a course — coordinator/admin supervisor view, no enrollment required")
    public ResponseEntity<ApiResponse<List<AssignmentResponse>>> getAssignmentsByCourseForCoordinator(
            @PathVariable UUID courseId) {

        List<AssignmentResponse> assignments = assignmentService.getAssignmentsByCourseForSupervisor(courseId);
        return ResponseEntity.ok(ApiResponse.success(assignments));
    }

    @GetMapping("/api/v1/assignments/{assignmentId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'INSTRUCTOR', 'ADMIN', 'COORDINATOR')")
    @Operation(summary = "Get assignment details — requester must be enrolled in the course")
    public ResponseEntity<ApiResponse<AssignmentDetailResponse>> getAssignmentForStudent(
            @PathVariable UUID assignmentId,
            @RequestHeader("X-User-Id") String userId) {

        AssignmentDetailResponse response = assignmentService.getAssignmentForStudent(assignmentId, UUID.fromString(userId));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/api/v1/assignments/{assignmentId}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Submit assignment answers")
    public ResponseEntity<ApiResponse<SubmissionDetailResponse>> submitAssignment(
            @PathVariable UUID assignmentId,
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody SubmitAssignmentRequest request) {

        UUID studentId = UUID.fromString(userId);
        SubmissionDetailResponse response = submissionService.submitAssignment(assignmentId, studentId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Assignment submitted successfully", response));
    }

    @GetMapping("/api/v1/assignments/{assignmentId}/submissions")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    @Operation(summary = "Get all submissions for an assignment")
    public ResponseEntity<ApiResponse<List<SubmissionResponse>>> getSubmissionsByAssignment(
            @PathVariable UUID assignmentId) {

        List<SubmissionResponse> submissions = submissionService.getSubmissionsByAssignment(assignmentId);
        return ResponseEntity.ok(ApiResponse.success(submissions));
    }

    @GetMapping("/api/v1/submissions/{submissionId}")
    @Operation(summary = "Get a specific submission with answer details")
    public ResponseEntity<ApiResponse<SubmissionDetailResponse>> getSubmission(
            @PathVariable UUID submissionId) {

        SubmissionDetailResponse response = submissionService.getSubmission(submissionId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/api/v1/assignments/{assignmentId}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    @Operation(summary = "Update assignment metadata (title, instructions, deadline, time limit)")
    public ResponseEntity<ApiResponse<AssignmentResponse>> updateAssignment(
            @PathVariable UUID assignmentId,
            @RequestHeader("X-User-Id") String userId,
            @RequestBody UpdateAssignmentRequest request) {

        UUID instructorId = UUID.fromString(userId);
        AssignmentResponse response = assignmentService.updateAssignment(assignmentId, request, instructorId);
        return ResponseEntity.ok(ApiResponse.success("Assignment updated successfully", response));
    }

    @DeleteMapping("/api/v1/assignments/{assignmentId}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    @Operation(summary = "Delete (soft-delete) an assignment — only the creator can delete it")
    public ResponseEntity<ApiResponse<Void>> deleteAssignment(
            @PathVariable UUID assignmentId,
            @RequestHeader("X-User-Id") String userId) {

        UUID instructorId = UUID.fromString(userId);
        assignmentService.deleteAssignment(assignmentId, instructorId);
        return ResponseEntity.ok(ApiResponse.success("Assignment deleted successfully", null));
    }

    @PatchMapping("/api/v1/submissions/{submissionId}/grade")
    @Operation(summary = "Manual grading endpoint (not permitted - MCQ is auto-graded)")
    public ResponseEntity<ApiResponse<Void>> gradeSubmission(
            @PathVariable UUID submissionId) {

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("MCQ assignments are auto-graded. Manual override not permitted."));
    }

    @GetMapping("/api/v1/students/{studentId}/progress")
    @Operation(summary = "Get student progress across all assignments")
    public ResponseEntity<ApiResponse<com.edusphere.assignment.dto.response.ProgressResponse>> getStudentProgress(
            @PathVariable UUID studentId) {

        com.edusphere.assignment.dto.response.ProgressResponse progress = submissionService.getStudentProgress(studentId);
        return ResponseEntity.ok(ApiResponse.success(progress));
    }

    @PostMapping(value = "/api/v1/courses/{courseId}/assignments/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('INSTRUCTOR')")
    @Operation(summary = "Create assignment with questions uploaded via Excel file")
    public ResponseEntity<ApiResponse<AssignmentResponse>> createAssignmentWithExcel(
            @PathVariable UUID courseId,
            @RequestHeader("X-User-Id") String userId,
            @RequestParam("title") String title,
            @RequestParam(value = "instructions", required = false) String instructions,
            @RequestParam("timeLimitMinutes") int timeLimitMinutes,
            @RequestParam("submissionDeadline") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime submissionDeadline,
            @RequestPart("file") MultipartFile file) {

        UUID instructorId = UUID.fromString(userId);
        AssignmentResponse response = assignmentService.createAssignmentWithExcel(
                courseId, title, instructions, timeLimitMinutes, submissionDeadline, instructorId, file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Assignment created successfully from Excel", response));
    }

    @GetMapping("/api/v1/assignments/{assignmentId}/attempt-status")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    @Operation(summary = "Get attempt status for an assignment — who submitted and who didn't")
    public ResponseEntity<ApiResponse<AttemptStatusResponse>> getAttemptStatus(
            @PathVariable UUID assignmentId) {

        AttemptStatusResponse response = submissionService.getAttemptStatus(assignmentId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/api/v1/assignments/count")
    @Operation(summary = "Get total assignment count (used by analytics service)")
    public ResponseEntity<ApiResponse<Long>> getTotalAssignmentCount() {
        long count = assignmentService.getTotalAssignmentCount();
        return ResponseEntity.ok(ApiResponse.success("Total assignment count retrieved", count));
    }

    @GetMapping("/api/v1/students/{studentId}/submissions")
    @PreAuthorize("hasAnyRole('STUDENT', 'INSTRUCTOR', 'ADMIN')")
    @Operation(summary = "Get all submissions for a student")
    public ResponseEntity<ApiResponse<List<SubmissionResponse>>> getStudentSubmissions(
            @PathVariable UUID studentId) {
        List<SubmissionResponse> submissions = submissionService.getSubmissionsByStudent(studentId);
        return ResponseEntity.ok(ApiResponse.success(submissions));
    }
}
