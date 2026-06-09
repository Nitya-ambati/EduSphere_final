package com.edusphere.audit.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerateComplianceReportRequest {

    @NotBlank(message = "reportName is required")
    private String reportName;

    private LocalDate fromDate;
    private LocalDate toDate;
}
