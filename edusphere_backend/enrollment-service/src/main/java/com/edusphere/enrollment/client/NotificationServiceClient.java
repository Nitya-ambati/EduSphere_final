package com.edusphere.enrollment.client;

import com.edusphere.enrollment.client.dto.ClientApiResponse;
import com.edusphere.enrollment.client.dto.DispatchNotificationRequest;
import com.edusphere.enrollment.config.FeignClientConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "notification-service", configuration = FeignClientConfig.class)
public interface NotificationServiceClient {

    @PostMapping("/api/v1/notifications/dispatch")
    ClientApiResponse<Object> dispatch(@RequestBody DispatchNotificationRequest request);
}
