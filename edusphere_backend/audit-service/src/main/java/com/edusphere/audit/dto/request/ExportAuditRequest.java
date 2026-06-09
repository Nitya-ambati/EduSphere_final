package com.edusphere.audit.dto.request;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExportAuditRequest {

    private LocalDateTime fromDate;
    private LocalDateTime toDate;
    private String format = "JSON";
}
