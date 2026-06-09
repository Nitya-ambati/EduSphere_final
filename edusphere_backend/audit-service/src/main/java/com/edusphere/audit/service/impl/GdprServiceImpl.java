package com.edusphere.audit.service.impl;

import com.edusphere.audit.entity.AuditLog;
import com.edusphere.audit.repository.AuditLogRepository;
import com.edusphere.audit.service.GdprService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GdprServiceImpl implements GdprService {

    private final AuditLogRepository auditLogRepository;

    private static final UUID ANONYMIZED_UUID = UUID.fromString("00000000-0000-0000-0000-000000000000");

    @Override
    public Map<String, Object> requestDataExport(UUID userId) {
        long auditRecordCount = auditLogRepository.findByActorId(userId, Pageable.unpaged()).getTotalElements();

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Your data export request has been received. You will receive an email within 24 hours.");
        result.put("auditRecordCount", auditRecordCount);

        log.info("GDPR data export requested for userId={}, auditRecordCount={}", userId, auditRecordCount);
        return result;
    }

    @Override
    @Transactional
    public void anonymizeUser(UUID userId, UUID requestedBy) {
        List<AuditLog> logs = auditLogRepository.findByActorId(userId, Pageable.unpaged()).getContent();

        List<AuditLog> updated = logs.stream()
                .peek(log -> log.setActorId(ANONYMIZED_UUID))
                .collect(Collectors.toList());

        auditLogRepository.saveAll(updated);
        log.info("GDPR anonymization completed: {} audit logs anonymized for userId={}, requestedBy={}",
                updated.size(), userId, requestedBy);
    }
}
