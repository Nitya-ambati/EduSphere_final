package com.edusphere.iam.client;

import com.edusphere.iam.client.dto.AuditLogRequest;
import com.edusphere.iam.client.dto.ClientApiResponse;
import com.edusphere.iam.config.FeignClientConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "audit-service", configuration = FeignClientConfig.class)
public interface AuditServiceClient {

    @PostMapping("/api/v1/audit/logs")
    ClientApiResponse<Object> createLog(@RequestBody AuditLogRequest request);
}
