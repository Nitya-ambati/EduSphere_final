package com.edusphere.course.service;

import com.edusphere.course.dto.request.CreateDepartmentRequest;
import com.edusphere.course.dto.response.CourseResponse;
import com.edusphere.course.dto.response.DepartmentResponse;

import java.util.List;
import java.util.UUID;

public interface DepartmentService {
    DepartmentResponse createDepartment(CreateDepartmentRequest request);
    List<DepartmentResponse> getAllDepartments();
    DepartmentResponse getDepartmentById(UUID deptId);
    DepartmentResponse getDepartmentByCode(String deptCode);
    List<CourseResponse> getCoursesByDepartment(UUID deptId);
    void deleteDepartment(UUID deptId);
}
