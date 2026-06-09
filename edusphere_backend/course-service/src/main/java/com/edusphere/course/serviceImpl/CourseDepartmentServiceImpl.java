package com.edusphere.course.serviceImpl;

import com.edusphere.course.entity.CourseDepartment;
import com.edusphere.course.exception.CustomException;
import com.edusphere.course.repository.CourseDepartmentRepository;
import com.edusphere.course.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseDepartmentServiceImpl {

    private final CourseDepartmentRepository courseDepartmentRepository;
    private final CourseRepository courseRepository;

    @Transactional
    public void linkCourseToDepartment(UUID courseId, UUID departmentId) {
        courseRepository.findById(courseId)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new CustomException("Course not found", HttpStatus.NOT_FOUND));

        if (courseDepartmentRepository.existsByCourseIdAndDeptId(courseId, departmentId)) {
            throw new CustomException("Course is already linked to this department", HttpStatus.CONFLICT);
        }

        CourseDepartment link = CourseDepartment.builder()
                .courseId(courseId)
                .deptId(departmentId)
                .build();
        courseDepartmentRepository.save(link);
    }

    @Transactional
    public void unlinkCourseFromDepartment(UUID courseId, UUID departmentId) {
        List<CourseDepartment> links = courseDepartmentRepository.findByCourseId(courseId).stream()
                .filter(cd -> cd.getDeptId().equals(departmentId))
                .collect(Collectors.toList());
        if (links.isEmpty()) {
            throw new CustomException("Course is not linked to this department", HttpStatus.NOT_FOUND);
        }
        courseDepartmentRepository.deleteAll(links);
    }

    public List<UUID> getDepartmentsByCourse(UUID courseId) {
        return courseDepartmentRepository.findByCourseId(courseId).stream()
                .map(CourseDepartment::getDeptId)
                .collect(Collectors.toList());
    }
}
