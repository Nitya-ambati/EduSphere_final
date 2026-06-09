package com.edusphere.course.controller;

import com.edusphere.course.dto.request.CreateDepartmentRequest;
import com.edusphere.course.dto.response.ApiResponse;
import com.edusphere.course.dto.response.CourseResponse;
import com.edusphere.course.dto.response.DepartmentResponse;
import com.edusphere.course.service.DepartmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
@Tag(name = "Departments")
@SecurityRequirement(name = "bearerAuth")
public class DepartmentController {

    private final DepartmentService departmentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SERVICE')")
    @Operation(summary = "Create department (Admin or internal service only)")
    public ResponseEntity<ApiResponse<DepartmentResponse>> create(@Valid @RequestBody CreateDepartmentRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Department created", departmentService.createDepartment(req)));
    }

    @GetMapping
    @Operation(summary = "List all departments")
    public ResponseEntity<ApiResponse<List<DepartmentResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(departmentService.getAllDepartments()));
    }

    @GetMapping("/{deptId}")
    @Operation(summary = "Get department by ID")
    public ResponseEntity<ApiResponse<DepartmentResponse>> getById(@PathVariable UUID deptId) {
        return ResponseEntity.ok(ApiResponse.success(departmentService.getDepartmentById(deptId)));
    }

    @GetMapping("/by-code/{deptCode}")
    @Operation(summary = "Get department by its unique code (used by IAM service during user onboarding)")
    public ResponseEntity<ApiResponse<DepartmentResponse>> getByCode(@PathVariable String deptCode) {
        return ResponseEntity.ok(ApiResponse.success(departmentService.getDepartmentByCode(deptCode)));
    }

    @GetMapping("/{deptId}/courses")
    @Operation(summary = "Get courses linked to department")
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getCourses(@PathVariable UUID deptId) {
        return ResponseEntity.ok(ApiResponse.success(departmentService.getCoursesByDepartment(deptId)));
    }

    @DeleteMapping("/{deptId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete department — Admin only (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID deptId) {
        departmentService.deleteDepartment(deptId);
        return ResponseEntity.ok(ApiResponse.success("Department deleted successfully", null));
    }
}
