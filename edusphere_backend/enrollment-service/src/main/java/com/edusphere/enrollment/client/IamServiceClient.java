package com.edusphere.enrollment.client;

import com.edusphere.enrollment.client.dto.ClientApiResponse;
import com.edusphere.enrollment.client.dto.UserDto;
import com.edusphere.enrollment.config.FeignClientConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "iam-service", configuration = FeignClientConfig.class)
public interface IamServiceClient {

    @GetMapping("/api/v1/users/{userId}")
    ClientApiResponse<UserDto> getUser(@PathVariable("userId") UUID userId);
}
