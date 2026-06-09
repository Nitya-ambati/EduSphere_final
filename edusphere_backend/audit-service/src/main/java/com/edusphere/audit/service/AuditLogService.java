package com.edusphere.audit.service;

import com.edusphere.audit.dto.request.AuditSearchRequest;
import com.edusphere.audit.dto.request.CreateAuditLogRequest;
import com.edusphere.audit.dto.request.ExportAuditRequest;
import com.edusphere.audit.dto.response.AuditLogResponse;
import com.edusphere.audit.dto.response.ExportResponse;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.UUID;

public interface AuditLogService {

    AuditLogResponse createLog(CreateAuditLogRequest request);

    Page<AuditLogResponse> searchLogs(AuditSearchRequest searchRequest, int page, int size);

    List<AuditLogResponse> getAllLogs();

    AuditLogResponse getLogById(UUID auditId);

    ExportResponse exportLogs(ExportAuditRequest request);
}
