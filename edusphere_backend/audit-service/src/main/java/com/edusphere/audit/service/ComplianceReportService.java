package com.edusphere.audit.service;

import com.edusphere.audit.dto.request.GenerateComplianceReportRequest;
import com.edusphere.audit.dto.response.ComplianceReportResponse;

import java.util.List;
import java.util.UUID;

public interface ComplianceReportService {

    ComplianceReportResponse generateReport(GenerateComplianceReportRequest request, UUID generatedBy);

    List<ComplianceReportResponse> listReports();
}
