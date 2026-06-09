package com.edusphere.course.repository;

import com.edusphere.course.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, UUID> {

    Optional<Department> findByDeptCodeAndDeletedFalse(String deptCode);

    List<Department> findAllByDeletedFalse();
}
