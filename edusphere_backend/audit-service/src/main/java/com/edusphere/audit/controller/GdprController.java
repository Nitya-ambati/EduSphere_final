package com.edusphere.audit.controller;

import com.edusphere.audit.dto.response.ApiResponse;
import com.edusphere.audit.service.GdprService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/gdpr")
@RequiredArgsConstructor
public class GdprController {

    private final GdprService gdprService;

    @GetMapping("/export")
    public ResponseEntity<ApiResponse<Map<String, Object>>> requestDataExport(
            @RequestHeader("X-User-Id") UUID userId) {
        Map<String, Object> result = gdprService.requestDataExport(userId);
        return ResponseEntity.ok(ApiResponse.success("Data export request submitted", result));
    }

    @PostMapping("/erasure")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> anonymizeUser(
            @RequestBody Map<String, String> body,
            @RequestHeader("X-User-Id") UUID requestedBy) {
        UUID userId = UUID.fromString(body.get("userId"));
        gdprService.anonymizeUser(userId, requestedBy);
        return ResponseEntity.ok(ApiResponse.success("User data anonymized successfully", null));
    }
}
