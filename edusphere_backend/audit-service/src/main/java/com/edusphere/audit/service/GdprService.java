package com.edusphere.audit.service;

import java.util.Map;
import java.util.UUID;

public interface GdprService {

    Map<String, Object> requestDataExport(UUID userId);

    void anonymizeUser(UUID userId, UUID requestedBy);
}
