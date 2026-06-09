package com.edusphere.analytics.client;

import com.edusphere.analytics.client.dto.ClientApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@FeignClient(name = "course-service")
public interface CourseServiceClient {

    @GetMapping("/api/v1/courses")
    ClientApiResponse<List<Object>> getAllCourses();
}
