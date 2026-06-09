package com.edusphere.course.serviceImpl;

import com.edusphere.course.dto.request.CreateDepartmentRequest;
import com.edusphere.course.dto.response.CourseResponse;
import com.edusphere.course.dto.response.DepartmentResponse;
import com.edusphere.course.entity.Department;
import com.edusphere.course.exception.CustomException;
import com.edusphere.course.repository.CourseDepartmentRepository;
import com.edusphere.course.repository.CourseRepository;
import com.edusphere.course.repository.DepartmentRepository;
import com.edusphere.course.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final CourseDepartmentRepository courseDepartmentRepository;
    private final CourseRepository courseRepository;

    @Override
    @Transactional
    public DepartmentResponse createDepartment(CreateDepartmentRequest request) {
        if (departmentRepository.findByDeptCodeAndDeletedFalse(request.getDepartmentCode()).isPresent()) {
            throw new CustomException("Department code already exists: " + request.getDepartmentCode(), HttpStatus.CONFLICT);
        }
        Department dept = Department.builder()
                .deptName(request.getDepartmentName())
                .deptCode(request.getDepartmentCode().toUpperCase())
                .description(request.getDescription())
                .build();
        return toResponse(departmentRepository.save(dept));
    }

    @Override
    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findAllByDeletedFalse().stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public DepartmentResponse getDepartmentById(UUID deptId) {
        Department dept = departmentRepository.findById(deptId)
                .orElseThrow(() -> new CustomException("Department not found with id: " + deptId, HttpStatus.NOT_FOUND));
        return toResponse(dept);
    }

    @Override
    public DepartmentResponse getDepartmentByCode(String deptCode) {
        Department dept = departmentRepository.findByDeptCodeAndDeletedFalse(deptCode.toUpperCase())
                .orElseThrow(() -> new CustomException(
                        "Department not found with code: '" + deptCode + "'. "
                        + "Use GET /api/v1/departments to see all available department codes.",
                        HttpStatus.NOT_FOUND));
        return toResponse(dept);
    }

    @Override
    public List<CourseResponse> getCoursesByDepartment(UUID deptId) {
        return courseDepartmentRepository.findByDeptId(deptId).stream()
                .map(cd -> courseRepository.findById(cd.getCourseId()).orElse(null))
                .filter(c -> c != null && !c.isDeleted())
                .map(c -> CourseResponse.builder()
                        .courseId(c.getCourseId()).courseName(c.getCourseName())
                        .courseCode(c.getCourseCode()).description(c.getDescription())
                        .enrollmentDeadline(c.getEnrollmentDeadline())
                        .completionDeadline(c.getCompletionDeadline())
                        .isActive(c.isActive())
                        .departmentIds(courseDepartmentRepository.findByCourseId(c.getCourseId())
                                .stream().map(x -> x.getDeptId()).collect(Collectors.toList()))
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteDepartment(UUID deptId) {
        Department dept = departmentRepository.findById(deptId)
                .orElseThrow(() -> new CustomException("Department not found with id: " + deptId, HttpStatus.NOT_FOUND));
        dept.setDeleted(true);
        departmentRepository.save(dept);
    }

    private DepartmentResponse toResponse(Department d) {
        return DepartmentResponse.builder()
                .departmentId(d.getDeptId())
                .departmentName(d.getDeptName())
                .departmentCode(d.getDeptCode())
                .description(d.getDescription())
                .build();
    }
}
