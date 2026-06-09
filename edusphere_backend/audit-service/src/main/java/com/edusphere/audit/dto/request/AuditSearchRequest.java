package com.edusphere.audit.dto.request;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditSearchRequest {

    private UUID actorId;
    private String action;
    private String resourceType;
    private LocalDateTime fromDate;
    private LocalDateTime toDate;
}
