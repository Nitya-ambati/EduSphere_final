package com.edusphere.audit.controller;

import com.edusphere.audit.dto.request.AuditSearchRequest;
import com.edusphere.audit.dto.request.CreateAuditLogRequest;
import com.edusphere.audit.dto.request.ExportAuditRequest;
import com.edusphere.audit.dto.response.ApiResponse;
import com.edusphere.audit.dto.response.AuditLogResponse;
import com.edusphere.audit.dto.response.ExportResponse;
import com.edusphere.audit.service.AuditLogService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
@Tag(name = "Audit Logs", description = "Tamper-evident audit log management (Admin only)")
@SecurityRequirement(name = "bearerAuth")
public class AuditController {

    private final AuditLogService auditLogService;

    @PostMapping("/logs")
    @PreAuthorize("hasAnyRole('SERVICE', 'ADMIN')")
    public ResponseEntity<ApiResponse<AuditLogResponse>> createLog(
            @RequestBody @Valid CreateAuditLogRequest request) {
        AuditLogResponse response = auditLogService.createLog(request);
        return ResponseEntity.ok(ApiResponse.success("Audit log created", response));
    }

    @GetMapping("/logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> searchLogs(
            @RequestParam(required = false) UUID actorId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        AuditSearchRequest searchRequest = AuditSearchRequest.builder()
                .actorId(actorId)
                .action(action)
                .resourceType(resourceType)
                .fromDate(fromDate)
                .toDate(toDate)
                .build();

        Page<AuditLogResponse> logs = auditLogService.searchLogs(searchRequest, page, size);
        return ResponseEntity.ok(ApiResponse.success("Audit logs retrieved", logs));
    }

    @GetMapping("/logs/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getAllLogs() {
        List<AuditLogResponse> logs = auditLogService.getAllLogs();
        return ResponseEntity.ok(ApiResponse.success("All audit logs retrieved", logs));
    }

    @GetMapping("/logs/{auditId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AuditLogResponse>> getLogById(@PathVariable UUID auditId) {
        AuditLogResponse response = auditLogService.getLogById(auditId);
        return ResponseEntity.ok(ApiResponse.success("Audit log retrieved", response));
    }

    @PostMapping("/logs/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ExportResponse>> exportLogs(
            @RequestBody ExportAuditRequest request) {
        ExportResponse exportResponse = auditLogService.exportLogs(request);
        return ResponseEntity.ok(ApiResponse.success("Audit logs exported", exportResponse));
    }
}
