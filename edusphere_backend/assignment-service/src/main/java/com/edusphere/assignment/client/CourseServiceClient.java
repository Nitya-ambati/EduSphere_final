package com.edusphere.assignment.client;

import com.edusphere.assignment.client.dto.ClientApiResponse;
import com.edusphere.assignment.client.dto.CourseDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "course-service")
public interface CourseServiceClient {

    @GetMapping("/api/v1/courses/{courseId}")
    ClientApiResponse<CourseDto> getCourse(@PathVariable("courseId") UUID courseId);
}
