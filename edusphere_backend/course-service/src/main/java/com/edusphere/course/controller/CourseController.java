package com.edusphere.course.controller;

import com.edusphere.course.entity.CourseContent;
import com.edusphere.course.exception.CustomException;
import com.edusphere.course.repository.CourseContentRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.edusphere.course.dto.request.AddContentRequest;
import com.edusphere.course.dto.request.CreateCourseRequest;
import com.edusphere.course.dto.request.UpdateCourseRequest;
import com.edusphere.course.dto.response.*;
import com.edusphere.course.service.ContentCompletionService;
import com.edusphere.course.service.CourseContentService;
import com.edusphere.course.service.CourseService;
import com.edusphere.course.service.SyllabusService;
import com.edusphere.course.serviceImpl.CourseDepartmentServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
@Tag(name = "Courses")
@SecurityRequirement(name = "bearerAuth")
public class CourseController {

    private final CourseService courseService;
    private final CourseContentService contentService;
    private final SyllabusService syllabusService;
    private final ContentCompletionService completionService;
    private final CourseDepartmentServiceImpl courseDepartmentService;
    private final CourseContentRepository courseContentRepository;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create course (Admin)")
    public ResponseEntity<ApiResponse<CourseResponse>> create(
            @Valid @RequestBody CreateCourseRequest req) {
        UUID adminId = getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Course created",
                courseService.createCourse(req, adminId)));
    }

    @GetMapping
    @Operation(summary = "List all active courses")
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(courseService.getAllCourses()));
    }

    @GetMapping("/deleted")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List deleted courses (Admin)")
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getDeleted() {
        return ResponseEntity.ok(ApiResponse.success(courseService.getDeletedCourses()));
    }

    @PostMapping("/{courseId}/restore")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Restore a deleted course (Admin)")
    public ResponseEntity<ApiResponse<Void>> restore(
            @PathVariable UUID courseId,
            @RequestHeader("X-User-Id") String adminId) {
        courseService.restoreCourse(courseId, UUID.fromString(adminId));
        return ResponseEntity.ok(ApiResponse.success("Course restored", null));
    }

    @GetMapping("/{courseId}")
    @Operation(summary = "Get course by ID")
    public ResponseEntity<ApiResponse<CourseResponse>> getById(@PathVariable UUID courseId) {
        return ResponseEntity.ok(ApiResponse.success(courseService.getCourseById(courseId)));
    }

    @PatchMapping("/{courseId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update course (Admin)")
    public ResponseEntity<ApiResponse<CourseResponse>> update(
            @PathVariable UUID courseId,
            @RequestBody UpdateCourseRequest req,
            @RequestHeader("X-User-Id") String adminId) {
        return ResponseEntity.ok(ApiResponse.success("Course updated",
                courseService.updateCourse(courseId, req, UUID.fromString(adminId))));
    }

    @DeleteMapping("/{courseId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete course (Admin)")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID courseId,
            @RequestHeader("X-User-Id") String adminId) {
        courseService.deleteCourse(courseId, UUID.fromString(adminId));
        return ResponseEntity.ok(ApiResponse.success("Course deleted", null));
    }

    // ── Course-Department Linking (Coordinator) ──────────────────────────────

    @PostMapping("/{courseId}/departments/{departmentId}")
    @PreAuthorize("hasRole('COORDINATOR')")
    @Operation(summary = "Link course to a department (Coordinator)")
    public ResponseEntity<ApiResponse<Void>> linkDepartment(
            @PathVariable UUID courseId,
            @PathVariable UUID departmentId) {
        courseDepartmentService.linkCourseToDepartment(courseId, departmentId);
        return ResponseEntity.ok(ApiResponse.success("Course linked to department", null));
    }

    @DeleteMapping("/{courseId}/departments/{departmentId}")
    @PreAuthorize("hasRole('COORDINATOR')")
    @Operation(summary = "Remove course-department link (Coordinator)")
    public ResponseEntity<ApiResponse<Void>> unlinkDepartment(
            @PathVariable UUID courseId,
            @PathVariable UUID departmentId) {
        courseDepartmentService.unlinkCourseFromDepartment(courseId, departmentId);
        return ResponseEntity.ok(ApiResponse.success("Course unlinked from department", null));
    }

    @GetMapping("/{courseId}/departments")
    @Operation(summary = "Get departments linked to a course")
    public ResponseEntity<ApiResponse<List<UUID>>> getLinkedDepartments(@PathVariable UUID courseId) {
        return ResponseEntity.ok(ApiResponse.success(courseDepartmentService.getDepartmentsByCourse(courseId)));
    }

    // ── Syllabus ──────────────────────────────────────────────────────────────

    @PostMapping(value = "/{courseId}/syllabus", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('COORDINATOR')")
    @Operation(summary = "Upload syllabus PDF (Coordinator)")
    public ResponseEntity<ApiResponse<SyllabusResponse>> uploadSyllabus(
            @PathVariable UUID courseId,
            @RequestPart("file") MultipartFile file,
            @RequestHeader("X-User-Id") String coordinatorId) {
        return ResponseEntity.ok(ApiResponse.success("Syllabus uploaded",
                syllabusService.uploadSyllabus(courseId, file, UUID.fromString(coordinatorId))));
    }

    @GetMapping("/{courseId}/syllabus")
    @Operation(summary = "Get syllabus metadata for course")
    public ResponseEntity<ApiResponse<SyllabusResponse>> getSyllabus(@PathVariable UUID courseId) {
        return ResponseEntity.ok(ApiResponse.success(syllabusService.getSyllabus(courseId)));
    }

    @GetMapping("/{courseId}/syllabus/file")
    @PreAuthorize("hasAnyRole('STUDENT', 'INSTRUCTOR', 'ADMIN', 'COORDINATOR')")
    @Operation(summary = "Download syllabus PDF for course")
    public ResponseEntity<byte[]> serveSyllabusFile(@PathVariable UUID courseId) throws IOException {
        SyllabusResponse syllabus = syllabusService.getSyllabus(courseId);
        Path filePath = Paths.get(syllabus.getFilePath());
        if (!Files.exists(filePath)) {
            throw new CustomException("Syllabus file not found on server", HttpStatus.NOT_FOUND);
        }
        byte[] bytes = Files.readAllBytes(filePath);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header("Content-Disposition", "inline; filename=\"" + filePath.getFileName() + "\"")
                .body(bytes);
    }

    // ── Course Content ─────────────────────────────────────────────────────────

    @PostMapping("/{courseId}/content")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    @Operation(summary = "Add course content (VIDEO_LINK or NOTE) — instructor must be enrolled")
    public ResponseEntity<ApiResponse<CourseContentResponse>> addContent(
            @PathVariable UUID courseId,
            @Valid @RequestBody AddContentRequest req,
            @RequestHeader("X-User-Id") String instructorId) {
        return ResponseEntity.ok(ApiResponse.success("Content added",
                contentService.addContent(courseId, req, UUID.fromString(instructorId))));
    }

    @PostMapping(value = "/{courseId}/content/upload-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('INSTRUCTOR')")
    @Operation(summary = "Upload a PDF file as course content — instructor must be enrolled in the course")
    public ResponseEntity<ApiResponse<CourseContentResponse>> uploadPdfContent(
            @PathVariable UUID courseId,
            @RequestParam("title") String title,
            @RequestParam(value = "sequenceNumber", defaultValue = "0") int sequenceNumber,
            @RequestPart("file") MultipartFile file,
            @RequestHeader("X-User-Id") String instructorId) {
        return ResponseEntity.ok(ApiResponse.success("PDF content uploaded",
                contentService.uploadPdfContent(courseId, title, sequenceNumber, file,
                        UUID.fromString(instructorId))));
    }

    @PostMapping("/{courseId}/content/add")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    @Operation(summary = "Add VIDEO_LINK or NOTE content (not PDF — use upload-pdf for PDFs)")
    public ResponseEntity<ApiResponse<CourseContentResponse>> addNonPdfContent(
            @PathVariable UUID courseId,
            @Valid @RequestBody AddContentRequest req,
            @RequestHeader("X-User-Id") String instructorId) {
        return ResponseEntity.ok(ApiResponse.success("Content added",
                contentService.addContent(courseId, req, UUID.fromString(instructorId))));
    }

    @GetMapping("/{courseId}/content")
    @PreAuthorize("hasAnyRole('STUDENT', 'INSTRUCTOR', 'ADMIN', 'COORDINATOR')")
    @Operation(summary = "List course content — user must be enrolled (ADMIN/COORDINATOR bypass enrollment check)")
    public ResponseEntity<ApiResponse<List<CourseContentResponse>>> listContent(
            @PathVariable UUID courseId,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {
        // ADMIN and COORDINATOR can view course content without enrollment
        if ("ADMIN".equalsIgnoreCase(userRole) || "COORDINATOR".equalsIgnoreCase(userRole)) {
            return ResponseEntity.ok(ApiResponse.success(
                    contentService.listContentForAdmin(courseId)));
        }
        return ResponseEntity.ok(ApiResponse.success(
                contentService.listContent(courseId, UUID.fromString(userId))));
    }

    @PatchMapping("/{courseId}/content/{contentId}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    @Operation(summary = "Update content item (Instructor)")
    public ResponseEntity<ApiResponse<CourseContentResponse>> updateContent(
            @PathVariable UUID courseId, @PathVariable UUID contentId,
            @RequestBody AddContentRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Content updated", contentService.updateContent(contentId, req)));
    }

    @DeleteMapping("/{courseId}/content/{contentId}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    @Operation(summary = "Delete content item (Instructor)")
    public ResponseEntity<ApiResponse<Void>> deleteContent(
            @PathVariable UUID courseId, @PathVariable UUID contentId) {
        contentService.deleteContent(contentId);
        return ResponseEntity.ok(ApiResponse.success("Content deleted", null));
    }

    // ── Content Completion (Student) ──────────────────────────────────────────

    @PostMapping("/{courseId}/content/{contentId}/complete")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Mark a content item as complete (Student)")
    public ResponseEntity<ApiResponse<Void>> markContentComplete(
            @PathVariable UUID courseId,
            @PathVariable UUID contentId,
            @RequestHeader("X-User-Id") String studentId) {
        completionService.markContentComplete(UUID.fromString(studentId), contentId, courseId);
        return ResponseEntity.ok(ApiResponse.success("Content marked as complete", null));
    }

    @GetMapping("/{courseId}/progress")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get student progress for a course (Student)")
    public ResponseEntity<ApiResponse<CourseProgressResponse>> getCourseProgress(
            @PathVariable UUID courseId,
            @RequestHeader("X-User-Id") String studentId) {
        CourseProgressResponse progress = completionService.getCourseProgress(
                UUID.fromString(studentId), courseId);
        return ResponseEntity.ok(ApiResponse.success("Course progress retrieved", progress));
    }

    @GetMapping("/{courseId}/content/{contentId}/file")
    @PreAuthorize("hasAnyRole('STUDENT', 'INSTRUCTOR', 'ADMIN', 'COORDINATOR')")
    @Operation(summary = "Serve a PDF content file")
    public ResponseEntity<byte[]> serveContentFile(
            @PathVariable UUID courseId,
            @PathVariable UUID contentId) throws IOException {
        CourseContent content = courseContentRepository.findById(contentId)
                .orElseThrow(() -> new CustomException("Content not found", HttpStatus.NOT_FOUND));
        Path filePath = Paths.get(content.getFilePathOrUrl());
        if (!Files.exists(filePath)) {
            throw new CustomException("File not found on server", HttpStatus.NOT_FOUND);
        }
        byte[] bytes = Files.readAllBytes(filePath);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header("Content-Disposition", "inline; filename=\"" + filePath.getFileName() + "\"")
                .body(bytes);
    }

    private UUID getCurrentUserId() {
        String userId = (String) org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
        return UUID.fromString(userId);
    }
}
