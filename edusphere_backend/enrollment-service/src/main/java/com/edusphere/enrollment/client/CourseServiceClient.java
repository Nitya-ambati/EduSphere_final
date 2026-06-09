package com.edusphere.enrollment.client;

import com.edusphere.enrollment.client.dto.ClientApiResponse;
import com.edusphere.enrollment.client.dto.CourseDto;
import com.edusphere.enrollment.config.FeignClientConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.UUID;

@FeignClient(name = "course-service", configuration = FeignClientConfig.class)
public interface CourseServiceClient {

    @GetMapping("/api/v1/courses/{courseId}")
    ClientApiResponse<CourseDto> getCourse(@PathVariable("courseId") UUID courseId);

    @GetMapping("/api/v1/courses/{courseId}/departments")
    ClientApiResponse<List<UUID>> getCourseDepartments(@PathVariable("courseId") UUID courseId);
}
