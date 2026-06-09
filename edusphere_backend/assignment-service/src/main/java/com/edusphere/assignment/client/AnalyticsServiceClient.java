package com.edusphere.assignment.client;

import com.edusphere.assignment.client.dto.ClientApiResponse;
import com.edusphere.assignment.client.dto.ProgressUpdateRequest;
import com.edusphere.assignment.config.FeignClientConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "analytics-service", configuration = FeignClientConfig.class)
public interface AnalyticsServiceClient {

    @PostMapping("/api/v1/analytics/progress")
    ClientApiResponse<Object> updateProgress(@RequestBody ProgressUpdateRequest request);
}
