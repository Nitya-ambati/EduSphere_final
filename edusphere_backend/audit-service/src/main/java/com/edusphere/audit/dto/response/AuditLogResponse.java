package com.edusphere.audit.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogResponse {

    private UUID auditId;
    private UUID actorId;
    private String actorRole;
    private String action;
    private String resourceType;
    private String resourceId;
    private LocalDateTime timestamp;
    private String ipAddress;
    private String serviceName;
    private String additionalData;
    private String previousHash;
    private String entryHash;
}
