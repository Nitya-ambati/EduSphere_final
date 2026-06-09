package com.edusphere.assignment.repository;

import com.edusphere.assignment.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {

    List<Assignment> findByCourseIdAndDeletedFalse(UUID courseId);

    List<Assignment> findByCourseIdAndIsActiveTrueAndDeletedFalse(UUID courseId);

    long countByDeletedFalse();
}
