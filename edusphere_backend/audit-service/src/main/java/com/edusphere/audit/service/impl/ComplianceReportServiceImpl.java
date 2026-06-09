package com.edusphere.audit.service.impl;

import com.edusphere.audit.dto.request.GenerateComplianceReportRequest;
import com.edusphere.audit.dto.response.ComplianceReportResponse;
import com.edusphere.audit.entity.ComplianceReport;
import com.edusphere.audit.repository.AuditLogRepository;
import com.edusphere.audit.repository.ComplianceReportRepository;
import com.edusphere.audit.service.ComplianceReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ComplianceReportServiceImpl implements ComplianceReportService {

    private final ComplianceReportRepository complianceReportRepository;
    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional
    public ComplianceReportResponse generateReport(GenerateComplianceReportRequest request, UUID generatedBy) {
        long totalEvents = 0;

        if (request.getFromDate() != null && request.getToDate() != null) {
            LocalDateTime from = request.getFromDate().atStartOfDay();
            LocalDateTime to = request.getToDate().atTime(23, 59, 59);
            totalEvents = auditLogRepository.countByTimestampBetween(from, to);
        } else {
            totalEvents = auditLogRepository.count();
        }

        ComplianceReport report = ComplianceReport.builder()
                .reportName(request.getReportName())
                .generatedBy(generatedBy)
                .fromDate(request.getFromDate())
                .toDate(request.getToDate())
                .totalEvents(totalEvents)
                .generatedAt(LocalDateTime.now())
                .build();

        report = complianceReportRepository.save(report);
        log.info("Compliance report generated: reportId={}, totalEvents={}", report.getReportId(), totalEvents);

        return toResponse(report);
    }

    @Override
    public List<ComplianceReportResponse> listReports() {
        return complianceReportRepository.findAllByOrderByGeneratedAtDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private ComplianceReportResponse toResponse(ComplianceReport report) {
        return ComplianceReportResponse.builder()
                .reportId(report.getReportId())
                .reportName(report.getReportName())
                .generatedBy(report.getGeneratedBy())
                .fromDate(report.getFromDate())
                .toDate(report.getToDate())
                .totalEvents(report.getTotalEvents())
                .generatedAt(report.getGeneratedAt())
                .build();
    }
}
