package com.edusphere.analytics.client;

import com.edusphere.analytics.client.dto.ClientApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "assignment-service")
public interface AssignmentServiceClient {

    @GetMapping("/api/v1/assignments/count")
    ClientApiResponse<Long> getTotalAssignmentCount();
}
