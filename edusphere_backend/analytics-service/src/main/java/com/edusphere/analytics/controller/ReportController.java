package com.edusphere.analytics.controller;

import com.edusphere.analytics.dto.request.GenerateReportRequest;
import com.edusphere.analytics.dto.response.ApiResponse;
import com.edusphere.analytics.dto.response.ReportResponse;
import com.edusphere.analytics.service.AnalyticsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final AnalyticsService analyticsService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReportResponse>>> listReports(
            @RequestHeader("X-User-Id") UUID userId) {
        List<ReportResponse> reports = analyticsService.listReports(userId);
        return ResponseEntity.ok(ApiResponse.success("Reports retrieved successfully", reports));
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<ReportResponse>> generateReport(
            @RequestBody @Valid GenerateReportRequest request,
            @RequestHeader("X-User-Id") UUID userId) {
        ReportResponse report = analyticsService.generateReport(request, userId);
        return ResponseEntity.ok(ApiResponse.success("Report generation initiated", report));
    }

    @GetMapping("/{reportId}")
    public ResponseEntity<ApiResponse<ReportResponse>> getReport(
            @PathVariable UUID reportId) {
        ReportResponse report = analyticsService.getReport(reportId);
        return ResponseEntity.ok(ApiResponse.success("Report retrieved successfully", report));
    }
}
