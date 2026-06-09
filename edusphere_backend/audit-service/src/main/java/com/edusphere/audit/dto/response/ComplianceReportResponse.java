package com.edusphere.audit.dto.response;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplianceReportResponse {

    private UUID reportId;
    private String reportName;
    private UUID generatedBy;
    private LocalDate fromDate;
    private LocalDate toDate;
    private long totalEvents;
    private LocalDateTime generatedAt;
}
