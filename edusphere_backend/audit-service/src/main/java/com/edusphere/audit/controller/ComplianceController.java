package com.edusphere.audit.controller;

import com.edusphere.audit.dto.request.GenerateComplianceReportRequest;
import com.edusphere.audit.dto.response.ApiResponse;
import com.edusphere.audit.dto.response.ComplianceReportResponse;
import com.edusphere.audit.service.ComplianceReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/compliance")
@RequiredArgsConstructor
public class ComplianceController {

    private final ComplianceReportService complianceReportService;

    @GetMapping("/reports")
    @PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR')")
    public ResponseEntity<ApiResponse<List<ComplianceReportResponse>>> listReports() {
        List<ComplianceReportResponse> reports = complianceReportService.listReports();
        return ResponseEntity.ok(ApiResponse.success("Compliance reports retrieved", reports));
    }

    @PostMapping("/reports/generate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ComplianceReportResponse>> generateReport(
            @RequestBody @Valid GenerateComplianceReportRequest request,
            @RequestHeader("X-User-Id") UUID userId) {
        ComplianceReportResponse response = complianceReportService.generateReport(request, userId);
        return ResponseEntity.ok(ApiResponse.success("Compliance report generated", response));
    }
}
