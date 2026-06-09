package com.edusphere.assignment.service;

import com.edusphere.assignment.dto.request.SubmitAssignmentRequest;
import com.edusphere.assignment.dto.response.AttemptStatusResponse;
import com.edusphere.assignment.dto.response.ProgressResponse;
import com.edusphere.assignment.dto.response.SubmissionDetailResponse;
import com.edusphere.assignment.dto.response.SubmissionResponse;

import java.util.List;
import java.util.UUID;

public interface SubmissionService {

    SubmissionDetailResponse submitAssignment(UUID assignmentId, UUID studentId, SubmitAssignmentRequest request);

    SubmissionDetailResponse getSubmission(UUID submissionId);

    List<SubmissionResponse> getSubmissionsByAssignment(UUID assignmentId);

    ProgressResponse getStudentProgress(UUID studentId);

    /** Returns who has attempted and who hasn't for a given assignment (instructor view). */
    AttemptStatusResponse getAttemptStatus(UUID assignmentId);

    List<SubmissionResponse> getSubmissionsByStudent(UUID studentId);
}
