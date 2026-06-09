package com.edusphere.assignment.service.impl;

import com.edusphere.assignment.client.AuditServiceClient;
import com.edusphere.assignment.client.CourseServiceClient;
import com.edusphere.assignment.client.EnrollmentServiceClient;
import com.edusphere.assignment.client.IamServiceClient;
import com.edusphere.assignment.client.dto.AuditLogRequest;
import com.edusphere.assignment.client.dto.ClientApiResponse;
import com.edusphere.assignment.client.dto.CourseDto;
import com.edusphere.assignment.client.dto.EnrollmentCheckDto;
import com.edusphere.assignment.client.dto.UserDto;
import com.edusphere.assignment.dto.request.CreateAssignmentRequest;
import com.edusphere.assignment.dto.request.QuestionRequest;
import com.edusphere.assignment.dto.request.UpdateAssignmentRequest;
import com.edusphere.assignment.dto.response.AssignmentDetailResponse;
import com.edusphere.assignment.dto.response.AssignmentResponse;
import com.edusphere.assignment.dto.response.QuestionResponse;
import com.edusphere.assignment.entity.Assignment;
import com.edusphere.assignment.entity.Question;
import com.edusphere.assignment.enums.AnswerOption;
import com.edusphere.assignment.exception.CustomException;
import com.edusphere.assignment.repository.AssignmentRepository;
import com.edusphere.assignment.repository.QuestionRepository;
import com.edusphere.assignment.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssignmentServiceImpl implements AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final QuestionRepository questionRepository;
    private final CourseServiceClient courseServiceClient;
    private final EnrollmentServiceClient enrollmentServiceClient;
    private final IamServiceClient iamServiceClient;
    private final AuditServiceClient auditServiceClient;

    @Override
    @Transactional
    public AssignmentResponse createAssignment(CreateAssignmentRequest request, UUID instructorId) {
        // 1. Verify instructor exists and is active in IAM — mandatory, no bypass
        verifyUserExists(instructorId);

        // 2. Validate course exists and is active
        ClientApiResponse<CourseDto> courseResponse = courseServiceClient.getCourse(request.getCourseId());
        if (courseResponse == null || !courseResponse.isSuccess() || courseResponse.getData() == null) {
            throw new CustomException("Course not found", HttpStatus.NOT_FOUND);
        }
        CourseDto course = courseResponse.getData();
        if (course.isDeleted() || !course.isActive()) {
            throw new CustomException("Course is not available for assignment creation", HttpStatus.BAD_REQUEST);
        }

        // 3. Validate instructor is enrolled in the course — mandatory, no bypass
        try {
            ClientApiResponse<EnrollmentCheckDto> enrollCheck =
                    enrollmentServiceClient.isEnrolled(instructorId, request.getCourseId());
            if (enrollCheck == null || enrollCheck.getData() == null || !enrollCheck.getData().isEnrolled()) {
                throw new CustomException(
                        "Instructor is not enrolled in this course. Enroll first to create assignments.",
                        HttpStatus.FORBIDDEN);
            }
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to verify instructor enrollment for course {}: {}", request.getCourseId(), e.getMessage());
            throw new CustomException("Unable to verify enrollment — enrollment service unavailable. Please try again.", HttpStatus.SERVICE_UNAVAILABLE);
        }

        Assignment assignment = Assignment.builder()
                .courseId(request.getCourseId())
                .title(request.getTitle())
                .instructions(request.getInstructions())
                .timeLimitMinutes(request.getTimeLimitMinutes())
                .submissionDeadline(request.getSubmissionDeadline())
                .createdBy(instructorId)
                .isActive(true)
                .build();

        Assignment savedAssignment = assignmentRepository.save(assignment);

        if (request.getQuestions() != null) {
            for (QuestionRequest qr : request.getQuestions()) {
                Question question = Question.builder()
                        .assignmentId(savedAssignment.getAssignmentId())
                        .questionText(qr.getQuestionText())
                        .optionA(qr.getOptionA())
                        .optionB(qr.getOptionB())
                        .optionC(qr.getOptionC())
                        .optionD(qr.getOptionD())
                        .correctOption(qr.getCorrectOption())
                        .sequenceNumber(qr.getSequenceNumber())
                        .createdAt(LocalDateTime.now())
                        .build();
                questionRepository.save(question);
            }
        }

        int questionCount = request.getQuestions() != null ? request.getQuestions().size() : 0;

        try {
            auditServiceClient.createLog(AuditLogRequest.builder()
                    .actorId(instructorId)
                    .actorRole("INSTRUCTOR")
                    .action("ASSIGNMENT_CREATED")
                    .resourceType("ASSIGNMENT")
                    .resourceId(savedAssignment.getAssignmentId().toString())
                    .serviceName("assignment-service")
                    .additionalData("courseId=" + request.getCourseId() + ", questions=" + questionCount)
                    .build());
        } catch (Exception e) {
            log.warn("Failed to create audit log for ASSIGNMENT_CREATED: {}", e.getMessage());
        }

        return mapToAssignmentResponse(savedAssignment, questionCount);
    }

    @Override
    @Transactional
    public AssignmentResponse createAssignmentWithExcel(UUID courseId, String title, String instructions,
                                                         int timeLimitMinutes, LocalDateTime submissionDeadline,
                                                         UUID instructorId, MultipartFile excelFile) {
        // 1. Verify instructor exists and is active in IAM — mandatory, no bypass
        verifyUserExists(instructorId);

        // 2. Validate course
        ClientApiResponse<CourseDto> courseResponse = courseServiceClient.getCourse(courseId);
        if (courseResponse == null || !courseResponse.isSuccess() || courseResponse.getData() == null) {
            throw new CustomException("Course not found", HttpStatus.NOT_FOUND);
        }
        CourseDto course = courseResponse.getData();
        if (course.isDeleted() || !course.isActive()) {
            throw new CustomException("Course is not available for assignment creation", HttpStatus.BAD_REQUEST);
        }

        // 3. Validate instructor enrollment — mandatory, no bypass
        try {
            ClientApiResponse<EnrollmentCheckDto> enrollCheck =
                    enrollmentServiceClient.isEnrolled(instructorId, courseId);
            if (enrollCheck == null || enrollCheck.getData() == null || !enrollCheck.getData().isEnrolled()) {
                throw new CustomException(
                        "Instructor is not enrolled in this course. Enroll first to create assignments.",
                        HttpStatus.FORBIDDEN);
            }
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to verify instructor enrollment for course {}: {}", courseId, e.getMessage());
            throw new CustomException("Unable to verify enrollment — enrollment service unavailable. Please try again.", HttpStatus.SERVICE_UNAVAILABLE);
        }

        // 4. Parse Excel
        List<QuestionRequest> questions = parseExcelQuestions(excelFile);
        if (questions.isEmpty()) {
            throw new CustomException("Excel file has no valid question rows", HttpStatus.BAD_REQUEST);
        }

        // 5. Create assignment
        Assignment assignment = Assignment.builder()
                .courseId(courseId)
                .title(title)
                .instructions(instructions)
                .timeLimitMinutes(timeLimitMinutes)
                .submissionDeadline(submissionDeadline)
                .createdBy(instructorId)
                .isActive(true)
                .build();
        Assignment savedAssignment = assignmentRepository.save(assignment);

        // 6. Save questions
        for (QuestionRequest qr : questions) {
            Question question = Question.builder()
                    .assignmentId(savedAssignment.getAssignmentId())
                    .questionText(qr.getQuestionText())
                    .optionA(qr.getOptionA())
                    .optionB(qr.getOptionB())
                    .optionC(qr.getOptionC())
                    .optionD(qr.getOptionD())
                    .correctOption(qr.getCorrectOption())
                    .sequenceNumber(qr.getSequenceNumber())
                    .createdAt(LocalDateTime.now())
                    .build();
            questionRepository.save(question);
        }

        try {
            auditServiceClient.createLog(AuditLogRequest.builder()
                    .actorId(instructorId)
                    .actorRole("INSTRUCTOR")
                    .action("ASSIGNMENT_CREATED")
                    .resourceType("ASSIGNMENT")
                    .resourceId(savedAssignment.getAssignmentId().toString())
                    .serviceName("assignment-service")
                    .additionalData("courseId=" + courseId + ", questions=" + questions.size() + ", source=excel")
                    .build());
        } catch (Exception e) {
            log.warn("Failed to create audit log for ASSIGNMENT_CREATED (excel): {}", e.getMessage());
        }

        return mapToAssignmentResponse(savedAssignment, questions.size());
    }

    @Override
    public List<AssignmentResponse> getAssignmentsByCourse(UUID courseId, UUID requestingUserId) {
        // Verify the requesting user is enrolled in this course — mandatory, no bypass
        try {
            ClientApiResponse<EnrollmentCheckDto> enrollCheck =
                    enrollmentServiceClient.isEnrolled(requestingUserId, courseId);
            if (enrollCheck == null || enrollCheck.getData() == null || !enrollCheck.getData().isEnrolled()) {
                throw new CustomException(
                        "You must be enrolled in this course to view its assignments.",
                        HttpStatus.FORBIDDEN);
            }
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to verify enrollment for getAssignmentsByCourse, courseId={}: {}", courseId, e.getMessage());
            throw new CustomException("Unable to verify enrollment — enrollment service unavailable. Please try again.", HttpStatus.SERVICE_UNAVAILABLE);
        }

        List<Assignment> assignments = assignmentRepository.findByCourseIdAndDeletedFalse(courseId);
        return assignments.stream()
                .map(a -> {
                    int count = questionRepository.findByAssignmentIdOrderBySequenceNumber(a.getAssignmentId()).size();
                    return mapToAssignmentResponse(a, count);
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<AssignmentResponse> getAssignmentsByCourseForSupervisor(UUID courseId) {
        List<Assignment> assignments = assignmentRepository.findByCourseIdAndDeletedFalse(courseId);
        return assignments.stream()
                .map(a -> {
                    int count = questionRepository.findByAssignmentIdOrderBySequenceNumber(a.getAssignmentId()).size();
                    return mapToAssignmentResponse(a, count);
                })
                .collect(Collectors.toList());
    }

    @Override
    public AssignmentDetailResponse getAssignmentForStudent(UUID assignmentId, UUID requestingUserId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new CustomException("Assignment not found", HttpStatus.NOT_FOUND));

        if (assignment.isDeleted()) {
            throw new CustomException("Assignment not found", HttpStatus.NOT_FOUND);
        }

        // Verify the requesting user is enrolled in this course — mandatory, no bypass
        try {
            ClientApiResponse<EnrollmentCheckDto> enrollCheck =
                    enrollmentServiceClient.isEnrolled(requestingUserId, assignment.getCourseId());
            if (enrollCheck == null || enrollCheck.getData() == null || !enrollCheck.getData().isEnrolled()) {
                throw new CustomException(
                        "You must be enrolled in this course to access this assignment.",
                        HttpStatus.FORBIDDEN);
            }
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to verify enrollment for assignmentId={}: {}", assignmentId, e.getMessage());
            throw new CustomException("Unable to verify enrollment — enrollment service unavailable. Please try again.", HttpStatus.SERVICE_UNAVAILABLE);
        }

        List<Question> questions = questionRepository.findByAssignmentIdOrderBySequenceNumber(assignmentId);

        List<QuestionResponse> questionResponses = questions.stream()
                .map(this::mapToQuestionResponseForStudent)
                .collect(Collectors.toList());

        return AssignmentDetailResponse.builder()
                .assignmentId(assignment.getAssignmentId())
                .courseId(assignment.getCourseId())
                .title(assignment.getTitle())
                .instructions(assignment.getInstructions())
                .timeLimitMinutes(assignment.getTimeLimitMinutes())
                .submissionDeadline(assignment.getSubmissionDeadline())
                .createdBy(assignment.getCreatedBy())
                .isActive(assignment.isActive())
                .questionCount(questions.size())
                .questions(questionResponses)
                .build();
    }

    @Override
    @Transactional
    public AssignmentResponse updateAssignment(UUID assignmentId, UpdateAssignmentRequest request, UUID instructorId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new CustomException("Assignment not found", HttpStatus.NOT_FOUND));

        if (assignment.isDeleted()) {
            throw new CustomException("Assignment not found", HttpStatus.NOT_FOUND);
        }

        if (!assignment.getCreatedBy().equals(instructorId)) {
            throw new CustomException("You can only update assignments you created", HttpStatus.FORBIDDEN);
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            assignment.setTitle(request.getTitle());
        }
        if (request.getInstructions() != null) {
            assignment.setInstructions(request.getInstructions());
        }
        if (request.getTimeLimitMinutes() != null) {
            assignment.setTimeLimitMinutes(request.getTimeLimitMinutes());
        }
        if (request.getSubmissionDeadline() != null) {
            assignment.setSubmissionDeadline(request.getSubmissionDeadline());
        }

        assignment = assignmentRepository.save(assignment);
        int questionCount = questionRepository.findByAssignmentIdOrderBySequenceNumber(assignmentId).size();
        return mapToAssignmentResponse(assignment, questionCount);
    }

    @Override
    @Transactional
    public void deleteAssignment(UUID assignmentId, UUID instructorId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new CustomException("Assignment not found", HttpStatus.NOT_FOUND));

        if (assignment.isDeleted()) {
            throw new CustomException("Assignment not found", HttpStatus.NOT_FOUND);
        }

        if (!assignment.getCreatedBy().equals(instructorId)) {
            throw new CustomException("You can only delete assignments you created", HttpStatus.FORBIDDEN);
        }

        assignment.setDeleted(true);
        assignment.setActive(false);
        assignmentRepository.save(assignment);

        try {
            auditServiceClient.createLog(AuditLogRequest.builder()
                    .actorId(instructorId)
                    .actorRole("INSTRUCTOR")
                    .action("ASSIGNMENT_DELETED")
                    .resourceType("ASSIGNMENT")
                    .resourceId(assignmentId.toString())
                    .serviceName("assignment-service")
                    .build());
        } catch (Exception e) {
            log.warn("Failed to create audit log for ASSIGNMENT_DELETED: {}", e.getMessage());
        }
    }

    @Override
    @Transactional
    public void deactivateAssignment(UUID assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new CustomException("Assignment not found", HttpStatus.NOT_FOUND));
        assignment.setActive(false);
        assignmentRepository.save(assignment);
    }

    @Override
    public long getTotalAssignmentCount() {
        return assignmentRepository.countByDeletedFalse();
    }

    private void verifyUserExists(UUID userId) {
        try {
            ClientApiResponse<UserDto> userResp = iamServiceClient.getUser(userId);
            if (userResp == null || !userResp.isSuccess() || userResp.getData() == null) {
                throw new CustomException("User not found in the system", HttpStatus.NOT_FOUND);
            }
            if (!userResp.getData().isActive()) {
                throw new CustomException("User account is deactivated", HttpStatus.FORBIDDEN);
            }
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to verify user existence in IAM service for userId {}: {}", userId, e.getMessage());
            throw new CustomException("Unable to verify user — IAM service unavailable. Please try again.", HttpStatus.SERVICE_UNAVAILABLE);
        }
    }

    private List<QuestionRequest> parseExcelQuestions(MultipartFile file) {
        List<QuestionRequest> questions = new ArrayList<>();
        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            // Expected columns: questionText | optionA | optionB | optionC | optionD | correctOption (A/B/C/D)
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String questionText = getCellString(row, 0);
                String optionA = getCellString(row, 1);
                String optionB = getCellString(row, 2);
                String optionC = getCellString(row, 3);
                String optionD = getCellString(row, 4);
                String correctStr = getCellString(row, 5);

                if (questionText == null || questionText.isBlank()) continue;

                AnswerOption correctOption;
                try {
                    correctOption = AnswerOption.valueOf(correctStr.trim().toUpperCase());
                } catch (Exception e) {
                    log.warn("Row {}: invalid correctOption '{}', skipping", i + 1, correctStr);
                    continue;
                }

                QuestionRequest qr = new QuestionRequest();
                qr.setQuestionText(questionText);
                qr.setOptionA(optionA);
                qr.setOptionB(optionB);
                qr.setOptionC(optionC);
                qr.setOptionD(optionD);
                qr.setCorrectOption(correctOption);
                qr.setSequenceNumber(questions.size() + 1);
                questions.add(qr);
            }
        } catch (Exception e) {
            throw new CustomException("Failed to parse Excel file: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
        return questions;
    }

    private String getCellString(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default -> null;
        };
    }

    private AssignmentResponse mapToAssignmentResponse(Assignment assignment, int questionCount) {
        return AssignmentResponse.builder()
                .assignmentId(assignment.getAssignmentId())
                .courseId(assignment.getCourseId())
                .title(assignment.getTitle())
                .instructions(assignment.getInstructions())
                .timeLimitMinutes(assignment.getTimeLimitMinutes())
                .submissionDeadline(assignment.getSubmissionDeadline())
                .createdBy(assignment.getCreatedBy())
                .isActive(assignment.isActive())
                .questionCount(questionCount)
                .build();
    }

    // Student view — correctOption is NOT included
    private QuestionResponse mapToQuestionResponseForStudent(Question question) {
        return QuestionResponse.builder()
                .questionId(question.getQuestionId())
                .questionText(question.getQuestionText())
                .optionA(question.getOptionA())
                .optionB(question.getOptionB())
                .optionC(question.getOptionC())
                .optionD(question.getOptionD())
                .sequenceNumber(question.getSequenceNumber())
                .build();
    }
}
