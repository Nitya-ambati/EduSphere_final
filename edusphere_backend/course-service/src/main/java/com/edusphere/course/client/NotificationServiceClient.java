package com.edusphere.course.client;

import com.edusphere.course.client.dto.ClientApiResponse;
import com.edusphere.course.client.dto.CourseCompletionNotificationRequest;
import com.edusphere.course.config.FeignClientConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "notification-service", configuration = FeignClientConfig.class)
public interface NotificationServiceClient {

    @PostMapping("/api/v1/notifications/course-completion")
    ClientApiResponse<Object> notifyCourseCompletion(@RequestBody CourseCompletionNotificationRequest request);
}
