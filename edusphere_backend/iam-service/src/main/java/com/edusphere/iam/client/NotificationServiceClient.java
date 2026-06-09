package com.edusphere.iam.client;

import com.edusphere.iam.client.dto.ClientApiResponse;
import com.edusphere.iam.client.dto.DispatchNotificationRequest;
import com.edusphere.iam.config.FeignClientConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "notification-service", configuration = FeignClientConfig.class)
public interface NotificationServiceClient {

    @PostMapping("/api/v1/notifications/dispatch")
    ClientApiResponse<Object> dispatch(@RequestBody DispatchNotificationRequest request);
}
