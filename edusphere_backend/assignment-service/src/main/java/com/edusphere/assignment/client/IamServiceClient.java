package com.edusphere.assignment.client;

import com.edusphere.assignment.client.dto.ClientApiResponse;
import com.edusphere.assignment.client.dto.UserDto;
import com.edusphere.assignment.config.FeignClientConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "iam-service", configuration = FeignClientConfig.class)
public interface IamServiceClient {

    @GetMapping("/api/v1/users/{userId}")
    ClientApiResponse<UserDto> getUser(@PathVariable("userId") UUID userId);
}
