package com.edusphere.iam.client;

import com.edusphere.iam.client.dto.ClientApiResponse;
import com.edusphere.iam.client.dto.CreateDepartmentClientRequest;
import com.edusphere.iam.client.dto.DepartmentDto;
import com.edusphere.iam.config.FeignClientConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * Feign client used by IAM service to resolve and create departments
 * during bulk user onboarding. The X-Service-Key header is injected
 * automatically by FeignClientConfig.
 */
@FeignClient(name = "course-service", configuration = FeignClientConfig.class)
public interface CourseServiceClient {

    @GetMapping("/api/v1/departments/by-code/{deptCode}")
    ClientApiResponse<DepartmentDto> getDepartmentByCode(@PathVariable("deptCode") String deptCode);

    @PostMapping("/api/v1/departments")
    ClientApiResponse<DepartmentDto> createDepartment(@RequestBody CreateDepartmentClientRequest request);
}