package com.edusphere.course.client;

import com.edusphere.course.client.dto.ClientApiResponse;
import com.edusphere.course.client.dto.ProgressUpdateRequest;
import com.edusphere.course.config.FeignClientConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "analytics-service", configuration = FeignClientConfig.class)
public interface AnalyticsServiceClient {

    @PostMapping("/api/v1/analytics/progress")
    ClientApiResponse<Object> updateProgress(@RequestBody ProgressUpdateRequest request);
}
