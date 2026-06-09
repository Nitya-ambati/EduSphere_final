package com.edusphere.analytics.service.impl;

import com.edusphere.analytics.client.AssignmentServiceClient;
import com.edusphere.analytics.client.CourseServiceClient;
import com.edusphere.analytics.client.dto.ClientApiResponse;
import com.edusphere.analytics.dto.request.GenerateReportRequest;
import com.edusphere.analytics.dto.request.ProgressUpdateRequest;
import com.edusphere.analytics.dto.response.KpiResponse;
import com.edusphere.analytics.dto.response.ReportResponse;
import com.edusphere.analytics.dto.response.StudentProgressResponse;
import com.edusphere.analytics.entity.Report;
import com.edusphere.analytics.entity.StudentProgress;
import com.edusphere.analytics.enums.ReportStatus;
import com.edusphere.analytics.exception.CustomException;
import com.edusphere.analytics.repository.ReportRepository;
import com.edusphere.analytics.repository.StudentProgressRepository;
import com.edusphere.analytics.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsServiceImpl implements AnalyticsService {

    private final ReportRepository reportRepository;
    private final StudentProgressRepository studentProgressRepository;
    private final CourseServiceClient courseServiceClient;
    private final AssignmentServiceClient assignmentServiceClient;

    @Override
    public KpiResponse getKpis(String courseId, String deptId) {
        String reportedFor = courseId != null ? courseId : "ALL";

        long totalCourses = 0;
        try {
            ClientApiResponse<List<Object>> courseResp = courseServiceClient.getAllCourses();
            if (courseResp != null && courseResp.getData() != null) {
                totalCourses = courseResp.getData().size();
            }
        } catch (Exception ex) {
            log.warn("Could not fetch course count from course-service: {}", ex.getMessage());
        }

        long totalStudents = studentProgressRepository.countDistinctStudents();

        long totalAssignments = 0;
        try {
            ClientApiResponse<Long> assignmentResp = assignmentServiceClient.getTotalAssignmentCount();
            if (assignmentResp != null && assignmentResp.getData() != null) {
                totalAssignments = assignmentResp.getData();
            }
        } catch (Exception ex) {
            log.warn("Could not fetch assignment count from assignment-service: {}", ex.getMessage());
            totalAssignments = studentProgressRepository.countDistinctSubmittedAssignments();
        }

        Double avgScore = courseId != null
                ? studentProgressRepository.findAverageScoreByCourseId(UUID.fromString(courseId))
                : studentProgressRepository.findGlobalAverageScore();

        return KpiResponse.builder()
                .totalCourses(totalCourses)
                .totalStudents(totalStudents)
                .totalAssignments(totalAssignments)
                .averageScore(avgScore != null ? Math.round(avgScore * 10.0) / 10.0 : 0.0)
                .passRate(0.0)
                .averageAttendance(0.0)
                .reportedFor(reportedFor)
                .build();
    }

    @Override
    @Transactional
    public ReportResponse generateReport(GenerateReportRequest request, UUID generatedBy) {
        String parameters = buildParametersJson(request);

        Report report = Report.builder()
                .reportType(request.getReportType())
                .generatedBy(generatedBy)
                .parameters(parameters)
                .status(ReportStatus.PENDING)
                .build();

        report = reportRepository.save(report);
        log.info("Report created with id={} and status=PENDING for user={}", report.getReportId(), generatedBy);

        return toReportResponse(report);
    }

    @Override
    public List<ReportResponse> listReports(UUID requesterId) {
        return reportRepository.findByGeneratedByOrderByCreatedAtDesc(requesterId)
                .stream()
                .map(this::toReportResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ReportResponse getReport(UUID reportId) {
        Report report = reportRepository.findByReportIdAndDeletedFalse(reportId)
                .orElseThrow(() -> new CustomException("Report not found", HttpStatus.NOT_FOUND));
        return toReportResponse(report);
    }

    @Override
    @Transactional
    public void updateProgress(ProgressUpdateRequest request) {
        if (request.getStudentId() == null || request.getCourseId() == null || request.getEventType() == null) {
            log.warn("Received incomplete progress update request, skipping");
            return;
        }

        StudentProgress progress = StudentProgress.builder()
                .studentId(request.getStudentId())
                .courseId(request.getCourseId())
                .assignmentId(request.getAssignmentId())
                .contentId(request.getContentId())
                .eventType(request.getEventType())
                .score(request.getScore())
                .eventTimestamp(LocalDateTime.now())
                .build();

        studentProgressRepository.save(progress);
        log.info("Saved progress event '{}' for student={} course={}", request.getEventType(), request.getStudentId(), request.getCourseId());
    }

    @Override
    public List<StudentProgressResponse> getStudentProgress(UUID studentId) {
        return studentProgressRepository.findByStudentIdOrderByEventTimestampDesc(studentId)
                .stream()
                .map(this::toProgressResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<StudentProgressResponse> getCourseProgress(UUID courseId) {
        return studentProgressRepository.findByCourseIdOrderByEventTimestampDesc(courseId)
                .stream()
                .map(this::toProgressResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<StudentProgressResponse> getStudentCourseProgress(UUID studentId, UUID courseId) {
        return studentProgressRepository.findByStudentIdAndCourseIdOrderByEventTimestampDesc(studentId, courseId)
                .stream()
                .map(this::toProgressResponse)
                .collect(Collectors.toList());
    }

    private StudentProgressResponse toProgressResponse(StudentProgress sp) {
        return StudentProgressResponse.builder()
                .progressId(sp.getProgressId())
                .studentId(sp.getStudentId())
                .courseId(sp.getCourseId())
                .assignmentId(sp.getAssignmentId())
                .contentId(sp.getContentId())
                .eventType(sp.getEventType())
                .score(sp.getScore())
                .eventTimestamp(sp.getEventTimestamp())
                .build();
    }

    private String buildParametersJson(GenerateReportRequest request) {
        StringBuilder sb = new StringBuilder("{");
        if (request.getCourseId() != null) sb.append("\"courseId\":\"").append(request.getCourseId()).append("\",");
        if (request.getDeptId() != null) sb.append("\"deptId\":\"").append(request.getDeptId()).append("\",");
        if (request.getFromDate() != null) sb.append("\"fromDate\":\"").append(request.getFromDate()).append("\",");
        if (request.getToDate() != null) sb.append("\"toDate\":\"").append(request.getToDate()).append("\",");
        String json = sb.toString();
        if (json.endsWith(",")) {
            json = json.substring(0, json.length() - 1);
        }
        return json + "}";
    }

    private ReportResponse toReportResponse(Report report) {
        return ReportResponse.builder()
                .reportId(report.getReportId())
                .reportType(report.getReportType())
                .generatedBy(report.getGeneratedBy())
                .parameters(report.getParameters())
                .status(report.getStatus())
                .filePath(report.getFilePath())
                .createdAt(report.getCreatedAt())
                .build();
    }
}
