package com.edusphere.audit.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAuditLogRequest {

    @NotNull(message = "actorId is required")
    private UUID actorId;

    @NotBlank(message = "actorRole is required")
    private String actorRole;

    @NotBlank(message = "action is required")
    private String action;

    private String resourceType;
    private String resourceId;
    private String ipAddress;

    @NotBlank(message = "serviceName is required")
    private String serviceName;

    private String additionalData;
}
