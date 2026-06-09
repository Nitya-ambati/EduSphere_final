package com.edusphere.analytics.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerateReportRequest {

    @NotBlank(message = "reportType is required")
    private String reportType;

    private String courseId;
    private String deptId;
    private String fromDate;
    private String toDate;
}
