package com.edusphere.course.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogRequest {
    private UUID actorId;
    private String actorRole;
    private String action;
    private String resourceType;
    private String resourceId;
    private String serviceName;
    private String additionalData;
}
