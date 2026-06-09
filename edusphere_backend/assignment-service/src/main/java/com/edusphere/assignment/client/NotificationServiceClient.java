package com.edusphere.assignment.client;

import com.edusphere.assignment.client.dto.ClientApiResponse;
import com.edusphere.assignment.client.dto.NotificationRequest;
import com.edusphere.assignment.config.FeignClientConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "notification-service", configuration = FeignClientConfig.class)
public interface NotificationServiceClient {

    @PostMapping("/api/v1/notifications/dispatch")
    ClientApiResponse<Object> dispatch(@RequestBody NotificationRequest request);
}
