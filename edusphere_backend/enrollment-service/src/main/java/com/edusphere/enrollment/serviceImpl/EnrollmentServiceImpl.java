package com.edusphere.enrollment.serviceImpl;

import com.edusphere.enrollment.client.AuditServiceClient;
import com.edusphere.enrollment.client.CourseServiceClient;
import com.edusphere.enrollment.client.IamServiceClient;
import com.edusphere.enrollment.client.NotificationServiceClient;
import com.edusphere.enrollment.client.dto.AuditLogRequest;
import com.edusphere.enrollment.client.dto.ClientApiResponse;
import com.edusphere.enrollment.client.dto.CourseDto;
import com.edusphere.enrollment.client.dto.DispatchNotificationRequest;
import com.edusphere.enrollment.client.dto.UserDto;
import com.edusphere.enrollment.dto.request.EnrollRequest;
import com.edusphere.enrollment.dto.response.EnrollmentResponse;
import com.edusphere.enrollment.entity.Enrollment;
import com.edusphere.enrollment.enums.EnrollmentStatus;
import com.edusphere.enrollment.enums.UserRole;
import com.edusphere.enrollment.exception.CustomException;
import com.edusphere.enrollment.repository.EnrollmentRepository;
import com.edusphere.enrollment.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EnrollmentServiceImpl implements EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseServiceClient courseServiceClient;
    private final IamServiceClient iamServiceClient;
    private final AuditServiceClient auditServiceClient;
    private final NotificationServiceClient notificationServiceClient;

    @Override
    @Transactional
    public EnrollmentResponse enroll(EnrollRequest request) {
        // 1. Validate user exists in IAM service — mandatory, no bypass
        UUID userDeptId = null;
        String iamUserRole = null;
        try {
            ClientApiResponse<UserDto> userResp = iamServiceClient.getUser(request.getUserId());
            if (userResp == null || !userResp.isSuccess() || userResp.getData() == null) {
                throw new CustomException("User not found in the system", HttpStatus.NOT_FOUND);
            }
            UserDto user = userResp.getData();
            if (!user.isActive()) {
                throw new CustomException("User account is deactivated", HttpStatus.FORBIDDEN);
            }
            userDeptId = user.getDepartmentId();
            iamUserRole = user.getRole();
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to verify user existence in IAM service: {}", e.getMessage());
            throw new CustomException("Unable to verify user — IAM service unavailable. Please try again.", HttpStatus.SERVICE_UNAVAILABLE);
        }

        // 2. Validate course exists and is available
        ClientApiResponse<CourseDto> courseResponse = courseServiceClient.getCourse(request.getCourseId());
        if (courseResponse == null || !courseResponse.isSuccess() || courseResponse.getData() == null) {
            throw new CustomException("Course not found", HttpStatus.NOT_FOUND);
        }
        CourseDto course = courseResponse.getData();
        if (course.isDeleted() || !course.isActive()) {
            throw new CustomException("Course is not available for enrollment", HttpStatus.BAD_REQUEST);
        }

        // 3. Department validation — enforced for STUDENT/INSTRUCTOR unless isException flag is set
        if (!request.isException()) {
            boolean isStudentOrInstructor = "STUDENT".equalsIgnoreCase(iamUserRole)
                    || "INSTRUCTOR".equalsIgnoreCase(iamUserRole);
            if (isStudentOrInstructor && userDeptId == null) {
                throw new CustomException(
                        "Your account does not have a department assigned. "
                                + "Contact your administrator to assign a department before enrolling.",
                        HttpStatus.FORBIDDEN);
            }
            if (userDeptId != null) {
                try {
                    ClientApiResponse<List<UUID>> deptResp = courseServiceClient.getCourseDepartments(request.getCourseId());
                    if (deptResp != null && deptResp.isSuccess() && deptResp.getData() != null
                            && !deptResp.getData().isEmpty()) {
                        List<UUID> courseDeptIds = deptResp.getData();
                        if (!courseDeptIds.contains(userDeptId)) {
                            throw new CustomException(
                                    "You can only enroll in courses linked to your department. "
                                            + "Contact your administrator for an exception enrollment.",
                                    HttpStatus.FORBIDDEN);
                        }
                    }
                } catch (CustomException e) {
                    throw e;
                } catch (Exception e) {
                    log.error("Could not verify course departments for course {}: {}", request.getCourseId(), e.getMessage());
                    throw new CustomException(
                            "Unable to verify course department restrictions — course service unavailable. Please try again.",
                            HttpStatus.SERVICE_UNAVAILABLE);
                }
            }
        }

        // 4. Prevent duplicate enrollment
        if (enrollmentRepository.existsByUserIdAndCourseId(request.getUserId(), request.getCourseId())) {
            throw new CustomException("User is already enrolled in this course", HttpStatus.CONFLICT);
        }

        Enrollment enrollment = Enrollment.builder()
                .userId(request.getUserId())
                .courseId(request.getCourseId())
                .userRole(request.getUserRole())
                .enrolledAt(LocalDateTime.now())
                .isException(request.isException())
                .status(EnrollmentStatus.ACTIVE)
                .build();

        Enrollment saved = enrollmentRepository.save(enrollment);

        try {
            auditServiceClient.createLog(AuditLogRequest.builder()
                    .actorId(request.getUserId())
                    .actorRole(request.getUserRole() != null ? request.getUserRole().name() : "STUDENT")
                    .action("USER_ENROLLED")
                    .resourceType("COURSE")
                    .resourceId(request.getCourseId().toString())
                    .serviceName("enrollment-service")
                    .additionalData("enrollmentId=" + saved.getEnrollmentId())
                    .build());
        } catch (Exception e) {
            log.warn("Failed to create audit log for USER_ENROLLED: {}", e.getMessage());
        }

        return toResponse(saved);
    }

    @Override
    @Transactional
    public EnrollmentResponse requestEnrollment(UUID studentId, UUID courseId) {
        // Fetch ALL existing enrollments for this user+course (including soft-deleted)
        // This avoids UK constraint violations caused by soft-deleted rows occupying the slot
        java.util.List<Enrollment> allExisting = enrollmentRepository.findByUserIdAndCourseId(studentId, courseId);

        if (!allExisting.isEmpty()) {
            // Pick the most recent record
            Enrollment latest = allExisting.stream()
                    .max(java.util.Comparator.comparing(e -> e.getCreatedAt() != null ? e.getCreatedAt() : java.time.LocalDateTime.MIN))
                    .orElse(allExisting.get(0));

            EnrollmentStatus currentStatus = latest.getStatus();

            // Block if already active or pending
            if (currentStatus == EnrollmentStatus.ACTIVE || currentStatus == EnrollmentStatus.PENDING) {
                throw new CustomException("You have already requested or are enrolled in this course", HttpStatus.CONFLICT);
            }

            // Reuse the existing record for REJECTED or DROPPED (even if soft-deleted)
            if (currentStatus == EnrollmentStatus.REJECTED || currentStatus == EnrollmentStatus.DROPPED) {
                latest.setStatus(EnrollmentStatus.PENDING);
                latest.setDeleted(false);
                latest.setEnrolledAt(LocalDateTime.now());
                return toResponse(enrollmentRepository.save(latest));
            }
        }

        // No usable existing record — create fresh
        Enrollment enrollment = Enrollment.builder()
                .userId(studentId)
                .courseId(courseId)
                .userRole(UserRole.STUDENT)
                .enrolledAt(LocalDateTime.now())
                .isException(false)
                .status(EnrollmentStatus.PENDING)
                .build();
        return toResponse(enrollmentRepository.save(enrollment));
    }

    @Override
    public List<EnrollmentResponse> getPendingRequests() {
        return enrollmentRepository.findByStatusAndIsDeletedFalse(EnrollmentStatus.PENDING)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<EnrollmentResponse> getStudentPendingRequests(UUID studentId) {
        return enrollmentRepository.findByUserIdAndStatusAndIsDeletedFalse(studentId, EnrollmentStatus.PENDING)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public EnrollmentResponse approveEnrollment(UUID enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new CustomException("Enrollment request not found", HttpStatus.NOT_FOUND));
        enrollment.setStatus(EnrollmentStatus.ACTIVE);
        return toResponse(enrollmentRepository.save(enrollment));
    }

    @Override
    @Transactional
    public void rejectEnrollment(UUID enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new CustomException("Enrollment request not found", HttpStatus.NOT_FOUND));
        enrollment.setStatus(EnrollmentStatus.REJECTED);
        // Do NOT mark as deleted — student needs to see REJECTED status in their course list
        enrollmentRepository.save(enrollment);

        // Notify the student about the rejection
        try {
            // Fetch course name for a meaningful message
            String courseName = "the requested course";
            try {
                ClientApiResponse<CourseDto> courseResp = courseServiceClient.getCourse(enrollment.getCourseId());
                if (courseResp != null && courseResp.isSuccess() && courseResp.getData() != null) {
                    courseName = courseResp.getData().getCourseName();
                }
            } catch (Exception ignored) {}

            notificationServiceClient.dispatch(DispatchNotificationRequest.builder()
                    .userId(enrollment.getUserId())
                    .eventType("ENROLLMENT_REJECTED")
                    .title("Enrollment Request Rejected")
                    .body("Your enrollment request for \"" + courseName + "\" has been rejected by the coordinator.")
                    .channel("IN_APP")
                    .build());
        } catch (Exception e) {
            log.warn("Failed to send rejection notification for enrollment {}: {}", enrollmentId, e.getMessage());
        }
    }

    @Override
    @Transactional
    public EnrollmentResponse selfEnroll(UUID userId, String userRole, UUID courseId) {
        UserRole role;
        try {
            role = UserRole.valueOf(userRole.toUpperCase());
        } catch (Exception e) {
            throw new CustomException("Invalid role: " + userRole, HttpStatus.BAD_REQUEST);
        }
        if (role != UserRole.STUDENT && role != UserRole.INSTRUCTOR) {
            throw new CustomException("Only STUDENT and INSTRUCTOR can self-enroll", HttpStatus.FORBIDDEN);
        }
        EnrollRequest request = EnrollRequest.builder()
                .userId(userId)
                .courseId(courseId)
                .userRole(role)
                .isException(false)
                .build();
        return enroll(request);
    }

    @Override
    public List<EnrollmentResponse> getEnrollmentsByUser(UUID userId) {
        return enrollmentRepository.findByUserIdAndIsDeletedFalse(userId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<EnrollmentResponse> getEnrollmentsByCourse(UUID courseId) {
        return enrollmentRepository.findByCourseIdAndIsDeletedFalse(courseId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void unenroll(UUID enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new CustomException(
                        "Enrollment not found with id: " + enrollmentId, HttpStatus.NOT_FOUND));
        enrollment.setDeleted(true);
        enrollment.setStatus(EnrollmentStatus.DROPPED);
        enrollmentRepository.save(enrollment);
    }

    @Override
    public List<EnrollmentResponse> getStudentEnrollments(UUID studentId) {
        return enrollmentRepository.findByUserIdAndUserRoleAndIsDeletedFalse(studentId, UserRole.STUDENT)
                .stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.ACTIVE || e.getStatus() == EnrollmentStatus.COMPLETED)
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<EnrollmentResponse> getInstructorEnrollments(UUID instructorId) {
        return enrollmentRepository.findByUserIdAndUserRoleAndIsDeletedFalse(instructorId, UserRole.INSTRUCTOR)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public boolean isEnrolled(UUID userId, UUID courseId) {
        return enrollmentRepository.findByUserIdAndCourseIdAndIsDeletedFalse(userId, courseId)
                .filter(e -> e.getStatus() == EnrollmentStatus.ACTIVE)
                .isPresent();
    }

    @Override
    @Transactional
    public void markEnrollmentComplete(UUID studentId, UUID courseId) {
        enrollmentRepository.findByUserIdAndCourseIdAndIsDeletedFalseAndStatus(
                studentId, courseId, EnrollmentStatus.ACTIVE)
            .ifPresent(e -> {
                e.setStatus(EnrollmentStatus.COMPLETED);
                enrollmentRepository.save(e);
            });
    }

    @Override
    public long getTotalEnrollmentCount() {
        return enrollmentRepository.countByIsDeletedFalse();
    }

    @Override
    public List<EnrollmentResponse> getDeletedEnrollments() {
        return enrollmentRepository.findByIsDeletedTrue()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    private EnrollmentResponse toResponse(Enrollment enrollment) {
        return EnrollmentResponse.builder()
                .enrollmentId(enrollment.getEnrollmentId())
                .userId(enrollment.getUserId())
                .courseId(enrollment.getCourseId())
                .userRole(enrollment.getUserRole())
                .enrolledAt(enrollment.getEnrolledAt())
                .isException(enrollment.isException())
                .status(enrollment.getStatus())
                .build();
    }
}
