package com.edusphere.course.client;

import com.edusphere.course.client.dto.ClientApiResponse;
import com.edusphere.course.client.dto.EnrollmentCheckDto;
import com.edusphere.course.config.FeignClientConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@FeignClient(name = "enrollment-service", configuration = FeignClientConfig.class)
public interface EnrollmentServiceClient {

    @GetMapping("/api/v1/enrollments/check")
    ClientApiResponse<EnrollmentCheckDto> isEnrolled(
            @RequestParam("userId") UUID userId,
            @RequestParam("courseId") UUID courseId
    );

    @PostMapping("/api/v1/enrollments/complete")
    ClientApiResponse<Void> markEnrollmentComplete(
            @RequestParam("studentId") UUID studentId,
            @RequestParam("courseId") UUID courseId
    );
}
