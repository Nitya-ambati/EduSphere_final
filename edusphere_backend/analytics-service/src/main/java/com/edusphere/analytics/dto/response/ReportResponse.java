package com.edusphere.analytics.dto.response;

import com.edusphere.analytics.enums.ReportStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportResponse {

    private UUID reportId;
    private String reportType;
    private UUID generatedBy;
    private String parameters;
    private ReportStatus status;
    private String filePath;
    private LocalDateTime createdAt;
}
