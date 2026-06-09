package com.edusphere.assignment.service;

import com.edusphere.assignment.dto.request.CreateAssignmentRequest;
import com.edusphere.assignment.dto.request.UpdateAssignmentRequest;
import com.edusphere.assignment.dto.response.AssignmentDetailResponse;
import com.edusphere.assignment.dto.response.AssignmentResponse;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface AssignmentService {

    AssignmentResponse createAssignment(CreateAssignmentRequest request, UUID instructorId);

    AssignmentResponse createAssignmentWithExcel(UUID courseId, String title, String instructions,
                                                  int timeLimitMinutes, LocalDateTime submissionDeadline,
                                                  UUID instructorId, MultipartFile excelFile);

    List<AssignmentResponse> getAssignmentsByCourse(UUID courseId, UUID requestingUserId);

    List<AssignmentResponse> getAssignmentsByCourseForSupervisor(UUID courseId);

    AssignmentDetailResponse getAssignmentForStudent(UUID assignmentId, UUID requestingUserId);

    AssignmentResponse updateAssignment(UUID assignmentId, UpdateAssignmentRequest request, UUID instructorId);

    void deleteAssignment(UUID assignmentId, UUID instructorId);

    void deactivateAssignment(UUID assignmentId);

    long getTotalAssignmentCount();
}
