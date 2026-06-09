package com.edusphere.audit.service.impl;

import com.edusphere.audit.dto.request.AuditSearchRequest;
import com.edusphere.audit.dto.request.CreateAuditLogRequest;
import com.edusphere.audit.dto.request.ExportAuditRequest;
import com.edusphere.audit.dto.response.AuditLogResponse;
import com.edusphere.audit.dto.response.ExportResponse;
import com.edusphere.audit.entity.AuditLog;
import com.edusphere.audit.exception.CustomException;
import com.edusphere.audit.repository.AuditLogRepository;
import com.edusphere.audit.service.AuditLogService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional
    public AuditLogResponse createLog(CreateAuditLogRequest request) {
        String previousHash = auditLogRepository.findTopByOrderByTimestampDesc()
                .map(AuditLog::getEntryHash)
                .orElse("GENESIS");

        LocalDateTime now = LocalDateTime.now();
        String resourceId = request.getResourceId() != null ? request.getResourceId() : "";
        String rawData = previousHash + request.getActorId().toString() + request.getAction()
                + resourceId + now.toString();

        String entryHash = computeSha256(rawData);

        AuditLog auditLog = AuditLog.builder()
                .actorId(request.getActorId())
                .actorRole(request.getActorRole())
                .action(request.getAction())
                .resourceType(request.getResourceType())
                .resourceId(request.getResourceId())
                .timestamp(now)
                .ipAddress(request.getIpAddress())
                .serviceName(request.getServiceName())
                .additionalData(request.getAdditionalData())
                .previousHash(previousHash)
                .entryHash(entryHash)
                .build();

        auditLog = auditLogRepository.save(auditLog);
        log.info("Audit log created: auditId={}, action={}", auditLog.getAuditId(), auditLog.getAction());

        return toAuditLogResponse(auditLog);
    }

    @Override
    public Page<AuditLogResponse> searchLogs(AuditSearchRequest searchRequest, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        if (searchRequest.getActorId() != null) {
            return auditLogRepository.findByActorId(searchRequest.getActorId(), pageable)
                    .map(this::toAuditLogResponse);
        }

        if (searchRequest.getAction() != null && !searchRequest.getAction().isBlank()) {
            return auditLogRepository.findByAction(searchRequest.getAction(), pageable)
                    .map(this::toAuditLogResponse);
        }

        if (searchRequest.getFromDate() != null && searchRequest.getToDate() != null) {
            return auditLogRepository.findByTimestampBetween(
                    searchRequest.getFromDate(), searchRequest.getToDate(), pageable)
                    .map(this::toAuditLogResponse);
        }

        return auditLogRepository.findAllByOrderByTimestampDesc(pageable)
                .map(this::toAuditLogResponse);
    }

    @Override
    public List<AuditLogResponse> getAllLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc(Pageable.unpaged())
                .stream()
                .map(this::toAuditLogResponse)
                .collect(Collectors.toList());
    }

    @Override
    public AuditLogResponse getLogById(UUID auditId) {
        AuditLog auditLog = auditLogRepository.findById(auditId)
                .orElseThrow(() -> new CustomException("Audit log not found", HttpStatus.NOT_FOUND));
        return toAuditLogResponse(auditLog);
    }

    @Override
    public ExportResponse exportLogs(ExportAuditRequest request) {
        List<AuditLog> logs;

        if (request.getFromDate() != null && request.getToDate() != null) {
            Pageable allPages = Pageable.unpaged();
            logs = auditLogRepository.findByTimestampBetween(
                    request.getFromDate(), request.getToDate(), allPages).getContent();
        } else {
            logs = auditLogRepository.findAll();
        }

        List<AuditLogResponse> responses = logs.stream()
                .map(this::toAuditLogResponse)
                .collect(Collectors.toList());

        String format = request.getFormat() != null ? request.getFormat() : "JSON";
        String content;
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            content = mapper.writeValueAsString(responses);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize audit logs: {}", e.getMessage());
            content = "[]";
        }

        return ExportResponse.builder()
                .content(content)
                .format(format)
                .totalRecords(responses.size())
                .build();
    }

    private String computeSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            log.error("SHA-256 not available: {}", e.getMessage());
            return UUID.randomUUID().toString().replace("-", "");
        }
    }

    private AuditLogResponse toAuditLogResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .auditId(log.getAuditId())
                .actorId(log.getActorId())
                .actorRole(log.getActorRole())
                .action(log.getAction())
                .resourceType(log.getResourceType())
                .resourceId(log.getResourceId())
                .timestamp(log.getTimestamp())
                .ipAddress(log.getIpAddress())
                .serviceName(log.getServiceName())
                .additionalData(log.getAdditionalData())
                .previousHash(log.getPreviousHash())
                .entryHash(log.getEntryHash())
                .build();
    }
}
