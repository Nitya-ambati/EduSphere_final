package com.edusphere.audit.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExportResponse {

    private String content;
    private String format;
    private long totalRecords;
}
