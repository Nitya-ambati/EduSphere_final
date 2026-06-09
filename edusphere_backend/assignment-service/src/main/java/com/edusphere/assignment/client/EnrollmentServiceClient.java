package com.edusphere.assignment.client;

import com.edusphere.assignment.client.dto.ClientApiResponse;
import com.edusphere.assignment.client.dto.EnrollmentCheckDto;
import com.edusphere.assignment.client.dto.EnrollmentDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.UUID;

import com.edusphere.assignment.config.FeignClientConfig;

@FeignClient(name = "enrollment-service", configuration = FeignClientConfig.class)
public interface EnrollmentServiceClient {

    @GetMapping("/api/v1/enrollments/check")
    ClientApiResponse<EnrollmentCheckDto> isEnrolled(
            @RequestParam("userId") UUID userId,
            @RequestParam("courseId") UUID courseId);

    @GetMapping("/api/v1/enrollments")
    ClientApiResponse<List<EnrollmentDto>> getEnrollmentsByCourse(
            @RequestParam("courseId") UUID courseId);
}
