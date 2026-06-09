package com.edusphere.notification.client;

import com.edusphere.notification.client.dto.ClientApiResponse;
import com.edusphere.notification.client.dto.UserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "iam-service")
public interface IamServiceClient {

    @GetMapping("/api/v1/users/{userId}")
    ClientApiResponse<UserDto> getUser(@PathVariable("userId") UUID userId);
}
