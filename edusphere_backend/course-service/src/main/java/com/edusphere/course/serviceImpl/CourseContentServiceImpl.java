package com.edusphere.course.serviceImpl;

import com.edusphere.course.client.EnrollmentServiceClient;
import com.edusphere.course.client.dto.ClientApiResponse;
import com.edusphere.course.client.dto.EnrollmentCheckDto;
import com.edusphere.course.dto.request.AddContentRequest;
import com.edusphere.course.dto.response.CourseContentResponse;
import com.edusphere.course.entity.CourseContent;
import com.edusphere.course.enums.ContentType;
import com.edusphere.course.exception.CustomException;
import com.edusphere.course.repository.CourseContentRepository;
import com.edusphere.course.service.CourseContentService;
import com.edusphere.course.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseContentServiceImpl implements CourseContentService {

    private final CourseContentRepository contentRepository;
    private final EnrollmentServiceClient enrollmentServiceClient;
    private final FileStorageService fileStorageService;

    @Value("${app.upload.content-path:uploads/course-content}")
    private String contentUploadPath;

    @Override
    @Transactional
    public CourseContentResponse addContent(UUID courseId, AddContentRequest request, UUID instructorId) {
        if (ContentType.PDF.equals(request.getContentType())) {
            throw new CustomException(
                    "PDF files must be uploaded via POST /{courseId}/content/upload-pdf (multipart). "
                    + "Use this endpoint only for VIDEO_LINK or NOTE content types.",
                    HttpStatus.BAD_REQUEST);
        }
        verifyInstructorEnrolled(instructorId, courseId);

        CourseContent content = CourseContent.builder()
                .courseId(courseId)
                .title(request.getTitle())
                .contentType(request.getContentType())
                .filePathOrUrl(request.getFilePathOrUrl())
                .body(request.getBody())
                .addedBy(instructorId)
                .sequenceNumber(request.getSequenceNumber())
                .build();
        return toResponse(contentRepository.save(content));
    }

    @Override
    @Transactional
    public CourseContentResponse uploadPdfContent(UUID courseId, String title, int sequenceNumber,
                                                   MultipartFile file, UUID instructorId) {
        verifyInstructorEnrolled(instructorId, courseId);

        // Validate it is a PDF
        String originalName = Objects.requireNonNullElse(file.getOriginalFilename(), "");
        String contentType = Objects.requireNonNullElse(file.getContentType(), "");
        if (!originalName.toLowerCase().endsWith(".pdf") && !contentType.equalsIgnoreCase("application/pdf")) {
            throw new CustomException("Only PDF files are accepted for this endpoint. "
                    + "Use the regular content endpoint for VIDEO_LINK or NOTE.", HttpStatus.BAD_REQUEST);
        }

        // Store file: uploads/course-content/{courseId}/{uuid}.pdf
        String filename = UUID.randomUUID() + ".pdf";
        String directory = contentUploadPath + "/" + courseId;
        String storedPath = fileStorageService.storeFile(directory, filename, file);

        CourseContent content = CourseContent.builder()
                .courseId(courseId)
                .title(title)
                .contentType(ContentType.PDF)
                .filePathOrUrl(storedPath)
                .addedBy(instructorId)
                .sequenceNumber(sequenceNumber)
                .build();
        return toResponse(contentRepository.save(content));
    }

    @Override
    public List<CourseContentResponse> listContent(UUID courseId, UUID requestingUserId) {
        // Verify the requesting user is enrolled in this course before showing content
        try {
            ClientApiResponse<EnrollmentCheckDto> enrollCheck =
                    enrollmentServiceClient.isEnrolled(requestingUserId, courseId);
            if (enrollCheck == null || enrollCheck.getData() == null || !enrollCheck.getData().isEnrolled()) {
                throw new CustomException(
                        "You must be enrolled in this course to view its content.",
                        HttpStatus.FORBIDDEN);
            }
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to verify enrollment for course content listing, courseId={}: {}", courseId, e.getMessage());
            throw new CustomException(
                    "Unable to verify enrollment — enrollment service unavailable. Please try again.",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }

        return contentRepository.findByCourseIdAndDeletedFalseOrderBySequenceNumber(courseId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<CourseContentResponse> listContentForAdmin(UUID courseId) {
        return contentRepository.findByCourseIdAndDeletedFalseOrderBySequenceNumber(courseId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CourseContentResponse updateContent(UUID contentId, AddContentRequest request) {
        CourseContent content = contentRepository.findById(contentId)
                .orElseThrow(() -> new CustomException("Content not found", HttpStatus.NOT_FOUND));
        if (request.getTitle() != null) content.setTitle(request.getTitle());
        if (request.getFilePathOrUrl() != null) content.setFilePathOrUrl(request.getFilePathOrUrl());
        if (request.getBody() != null) content.setBody(request.getBody());
        if (request.getSequenceNumber() > 0) content.setSequenceNumber(request.getSequenceNumber());
        return toResponse(contentRepository.save(content));
    }

    @Override
    @Transactional
    public void deleteContent(UUID contentId) {
        CourseContent content = contentRepository.findById(contentId)
                .orElseThrow(() -> new CustomException("Content not found", HttpStatus.NOT_FOUND));
        content.setDeleted(true);
        contentRepository.save(content);
    }

    // ─── helpers ────────────────────────────────────────────────────────────────

    private void verifyInstructorEnrolled(UUID instructorId, UUID courseId) {
        try {
            ClientApiResponse<EnrollmentCheckDto> enrollCheck =
                    enrollmentServiceClient.isEnrolled(instructorId, courseId);
            if (enrollCheck == null || enrollCheck.getData() == null || !enrollCheck.getData().isEnrolled()) {
                throw new CustomException(
                        "Instructor is not enrolled in this course. Enroll first to upload content.",
                        HttpStatus.FORBIDDEN);
            }
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to verify instructor enrollment for course {}: {}", courseId, e.getMessage());
            throw new CustomException(
                    "Unable to verify enrollment — enrollment service unavailable. Please try again.",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }
    }

    private CourseContentResponse toResponse(CourseContent c) {
        return CourseContentResponse.builder()
                .contentId(c.getContentId())
                .courseId(c.getCourseId())
                .title(c.getTitle())
                .contentType(c.getContentType())
                .filePathOrUrl(c.getFilePathOrUrl())
                .body(c.getBody())
                .addedBy(c.getAddedBy())
                .sequenceNumber(c.getSequenceNumber())
                .build();
    }
}
