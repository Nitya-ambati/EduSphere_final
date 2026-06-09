package com.edusphere.course.serviceImpl;

import com.edusphere.course.client.AuditServiceClient;
import com.edusphere.course.client.dto.AuditLogRequest;
import com.edusphere.course.dto.request.CreateCourseRequest;
import com.edusphere.course.dto.request.UpdateCourseRequest;
import com.edusphere.course.dto.response.CourseResponse;
import com.edusphere.course.entity.Course;
import com.edusphere.course.entity.CourseDepartment;
import com.edusphere.course.exception.CustomException;
import com.edusphere.course.repository.CourseDepartmentRepository;
import com.edusphere.course.repository.CourseRepository;
import com.edusphere.course.service.CourseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final CourseDepartmentRepository courseDepartmentRepository;
    private final AuditServiceClient auditServiceClient;

    @Override
    @Transactional
    public CourseResponse createCourse(CreateCourseRequest request, UUID adminId) {
        if (courseRepository.findByCourseCodeAndDeletedFalse(request.getCourseCode()).isPresent()) {
            throw new CustomException("Course code already exists: " + request.getCourseCode(), HttpStatus.CONFLICT);
        }
        Course course = Course.builder()
                .courseName(request.getCourseName())
                .courseCode(request.getCourseCode().toUpperCase())
                .description(request.getDescription())
                .duration(request.getDuration())
                .enrollmentDeadline(request.getEnrollmentDeadline())
                .completionDeadline(request.getCompletionDeadline())
                .createdByAdmin(adminId)
                .isActive(true)
                .build();
        Course saved = courseRepository.save(course);

        if (request.getDepartmentIds() != null) {
            request.getDepartmentIds().forEach(deptId -> {
                CourseDepartment cd = CourseDepartment.builder()
                        .courseId(saved.getCourseId()).deptId(deptId).build();
                courseDepartmentRepository.save(cd);
            });
        }

        try {
            auditServiceClient.createLog(AuditLogRequest.builder()
                    .actorId(adminId).actorRole("ADMIN")
                    .action("COURSE_CREATED").resourceType("COURSE")
                    .resourceId(saved.getCourseId().toString())
                    .serviceName("course-service")
                    .additionalData("courseCode=" + saved.getCourseCode())
                    .build());
        } catch (Exception e) { log.warn("Audit log failed for COURSE_CREATED: {}", e.getMessage()); }

        return buildResponse(saved);
    }

    @Override
    public List<CourseResponse> getAllCourses() {
        return courseRepository.findAllByDeletedFalseAndIsActiveTrue().stream()
                .map(this::buildResponse).collect(Collectors.toList());
    }

    @Override
    public List<CourseResponse> getDeletedCourses() {
        return courseRepository.findAllByDeletedTrue().stream()
                .map(this::buildResponse).collect(Collectors.toList());
    }

    @Override
    public CourseResponse getCourseById(UUID courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CustomException("Course not found", HttpStatus.NOT_FOUND));
        return buildResponse(course);
    }

    @Override
    @Transactional
    public CourseResponse updateCourse(UUID courseId, UpdateCourseRequest request, UUID adminId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CustomException("Course not found", HttpStatus.NOT_FOUND));
        if (request.getCourseName() != null) course.setCourseName(request.getCourseName());
        if (request.getDescription() != null) course.setDescription(request.getDescription());
        if (request.getDuration() != null) course.setDuration(request.getDuration());
        if (request.getEnrollmentDeadline() != null) course.setEnrollmentDeadline(request.getEnrollmentDeadline());
        if (request.getCompletionDeadline() != null) course.setCompletionDeadline(request.getCompletionDeadline());
        if (request.getIsActive() != null) course.setActive(request.getIsActive());
        CourseResponse resp = buildResponse(courseRepository.save(course));
        try {
            auditServiceClient.createLog(AuditLogRequest.builder()
                    .actorId(adminId).actorRole("ADMIN")
                    .action("COURSE_UPDATED").resourceType("COURSE")
                    .resourceId(courseId.toString())
                    .serviceName("course-service").build());
        } catch (Exception e) { log.warn("Audit log failed for COURSE_UPDATED: {}", e.getMessage()); }
        return resp;
    }

    @Override
    @Transactional
    public void deleteCourse(UUID courseId, UUID adminId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CustomException("Course not found", HttpStatus.NOT_FOUND));
        course.setDeleted(true);
        courseRepository.save(course);
        try {
            auditServiceClient.createLog(AuditLogRequest.builder()
                    .actorId(adminId).actorRole("ADMIN")
                    .action("COURSE_DELETED").resourceType("COURSE")
                    .resourceId(courseId.toString())
                    .serviceName("course-service").build());
        } catch (Exception e) { log.warn("Audit log failed for COURSE_DELETED: {}", e.getMessage()); }
    }

    @Override
    @Transactional
    public void restoreCourse(UUID courseId, UUID adminId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CustomException("Course not found", HttpStatus.NOT_FOUND));
        course.setDeleted(false);
        course.setActive(true);
        courseRepository.save(course);
        try {
            auditServiceClient.createLog(AuditLogRequest.builder()
                    .actorId(adminId).actorRole("ADMIN")
                    .action("COURSE_RESTORED").resourceType("COURSE")
                    .resourceId(courseId.toString())
                    .serviceName("course-service").build());
        } catch (Exception e) { log.warn("Audit log failed for COURSE_RESTORED: {}", e.getMessage()); }
    }

    private CourseResponse buildResponse(Course c) {
        List<UUID> deptIds = courseDepartmentRepository.findByCourseId(c.getCourseId())
                .stream().map(CourseDepartment::getDeptId).collect(Collectors.toList());
        return CourseResponse.builder()
                .courseId(c.getCourseId()).courseName(c.getCourseName())
                .courseCode(c.getCourseCode()).description(c.getDescription())
                .duration(c.getDuration())
                .enrollmentDeadline(c.getEnrollmentDeadline())
                .completionDeadline(c.getCompletionDeadline())
                .isActive(c.isActive()).departmentIds(deptIds).build();
    }
}
