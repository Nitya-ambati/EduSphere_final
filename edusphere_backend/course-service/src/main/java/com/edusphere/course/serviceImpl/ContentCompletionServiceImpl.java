package com.edusphere.course.serviceImpl;

import com.edusphere.course.client.AnalyticsServiceClient;
import com.edusphere.course.client.EnrollmentServiceClient;
import com.edusphere.course.client.NotificationServiceClient;
import com.edusphere.course.client.dto.ClientApiResponse;
import com.edusphere.course.client.dto.CourseCompletionNotificationRequest;
import com.edusphere.course.client.dto.EnrollmentCheckDto;
import com.edusphere.course.client.dto.ProgressUpdateRequest;
import com.edusphere.course.dto.response.CourseProgressResponse;
import com.edusphere.course.entity.ContentCompletion;
import com.edusphere.course.entity.Course;
import com.edusphere.course.exception.CustomException;
import com.edusphere.course.repository.ContentCompletionRepository;
import com.edusphere.course.repository.CourseContentRepository;
import com.edusphere.course.repository.CourseRepository;
import com.edusphere.course.service.ContentCompletionService;
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
public class ContentCompletionServiceImpl implements ContentCompletionService {

    private final ContentCompletionRepository completionRepository;
    private final CourseContentRepository contentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentServiceClient enrollmentServiceClient;
    private final AnalyticsServiceClient analyticsServiceClient;
    private final NotificationServiceClient notificationServiceClient;

    @Override
    @Transactional
    public void markContentComplete(UUID studentId, UUID contentId, UUID courseId) {
        // Verify student is enrolled in this course — mandatory, no bypass
        try {
            ClientApiResponse<EnrollmentCheckDto> enrollCheck =
                    enrollmentServiceClient.isEnrolled(studentId, courseId);
            if (enrollCheck == null || enrollCheck.getData() == null || !enrollCheck.getData().isEnrolled()) {
                throw new CustomException("Student is not enrolled in this course", HttpStatus.FORBIDDEN);
            }
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to verify student enrollment for course {}: {}", courseId, e.getMessage());
            throw new CustomException("Unable to verify enrollment — enrollment service unavailable. Please try again.", HttpStatus.SERVICE_UNAVAILABLE);
        }

        contentRepository.findById(contentId)
                .filter(c -> c.getCourseId().equals(courseId) && !c.isDeleted())
                .orElseThrow(() -> new CustomException("Content not found in course", HttpStatus.NOT_FOUND));

        if (completionRepository.existsByStudentIdAndContentId(studentId, contentId)) {
            throw new CustomException("Content already marked as complete", HttpStatus.CONFLICT);
        }

        ContentCompletion completion = ContentCompletion.builder()
                .studentId(studentId)
                .contentId(contentId)
                .courseId(courseId)
                .completedAt(LocalDateTime.now())
                .build();
        completionRepository.save(completion);

        // Notify analytics: CONTENT_COMPLETED
        try {
            analyticsServiceClient.updateProgress(ProgressUpdateRequest.builder()
                    .studentId(studentId)
                    .courseId(courseId)
                    .contentId(contentId)
                    .eventType("CONTENT_COMPLETED")
                    .build());
        } catch (Exception e) {
            log.warn("Failed to notify analytics for CONTENT_COMPLETED: {}", e.getMessage());
        }

        // Check if all content is now complete
        long totalContents = contentRepository.findByCourseIdAndDeletedFalseOrderBySequenceNumber(courseId).size();
        long completedCount = completionRepository.findByStudentIdAndCourseId(studentId, courseId).size();

        if (totalContents > 0 && completedCount >= totalContents) {
            // Notify analytics: COURSE_COMPLETED
            try {
                analyticsServiceClient.updateProgress(ProgressUpdateRequest.builder()
                        .studentId(studentId)
                        .courseId(courseId)
                        .eventType("COURSE_COMPLETED")
                        .build());
            } catch (Exception e) {
                log.warn("Failed to notify analytics for COURSE_COMPLETED: {}", e.getMessage());
            }

            // Mark enrollment as COMPLETED in enrollment-service
            try {
                enrollmentServiceClient.markEnrollmentComplete(studentId, courseId);
            } catch (Exception e) {
                log.warn("Failed to mark enrollment as COMPLETED: {}", e.getMessage());
            }

            // Send course completion email notification
            try {
                String courseTitle = courseRepository.findById(courseId)
                        .map(Course::getCourseName)
                        .orElse("your course");

                notificationServiceClient.notifyCourseCompletion(
                        CourseCompletionNotificationRequest.builder()
                                .studentId(studentId)
                                .courseId(courseId)
                                .courseTitle(courseTitle)
                                .build());
            } catch (Exception e) {
                log.warn("Failed to send course completion notification: {}", e.getMessage());
            }
        }
    }

    @Override
    public CourseProgressResponse getCourseProgress(UUID studentId, UUID courseId) {
        long totalContents = contentRepository.findByCourseIdAndDeletedFalseOrderBySequenceNumber(courseId).size();
        List<ContentCompletion> completions = completionRepository.findByStudentIdAndCourseId(studentId, courseId);
        long completedCount = completions.size();

        double progressPct = totalContents > 0 ? Math.min(100.0, completedCount * 100.0 / totalContents) : 0.0;

        List<UUID> completedIds = completions.stream()
                .map(ContentCompletion::getContentId)
                .collect(Collectors.toList());

        return CourseProgressResponse.builder()
                .studentId(studentId)
                .courseId(courseId)
                .totalContents((int) totalContents)
                .completedContents((int) completedCount)
                .progressPercentage(progressPct)
                .completedContentIds(completedIds)
                .build();
    }
}
