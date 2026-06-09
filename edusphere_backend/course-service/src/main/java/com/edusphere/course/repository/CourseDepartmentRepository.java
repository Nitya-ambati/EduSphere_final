package com.edusphere.course.repository;

import com.edusphere.course.entity.CourseDepartment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CourseDepartmentRepository extends JpaRepository<CourseDepartment, UUID> {

    List<CourseDepartment> findByCourseId(UUID courseId);

    List<CourseDepartment> findByDeptId(UUID deptId);

    boolean existsByCourseIdAndDeptId(UUID courseId, UUID deptId);

    void deleteByCourseId(UUID courseId);
}
