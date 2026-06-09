package com.edusphere.enrollment.repository;

import com.edusphere.enrollment.entity.Enrollment;
import com.edusphere.enrollment.enums.EnrollmentStatus;
import com.edusphere.enrollment.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {

    List<Enrollment> findByUserIdAndIsDeletedFalse(UUID userId);

    List<Enrollment> findByCourseIdAndIsDeletedFalse(UUID courseId);

    Optional<Enrollment> findByUserIdAndCourseIdAndIsDeletedFalse(UUID userId, UUID courseId);

    boolean existsByUserIdAndCourseId(UUID userId, UUID courseId);

    // Finds ANY enrollment regardless of soft-delete status (needed to avoid UK constraint violations)
    List<Enrollment> findByUserIdAndCourseId(UUID userId, UUID courseId);

    boolean existsByUserIdAndCourseIdAndIsDeletedFalseAndStatusNotIn(UUID userId, UUID courseId, java.util.Collection<EnrollmentStatus> statuses);

    Optional<Enrollment> findByUserIdAndCourseIdAndIsDeletedFalseAndStatus(UUID userId, UUID courseId, EnrollmentStatus status);

    List<Enrollment> findByUserIdAndUserRoleAndIsDeletedFalse(UUID userId, UserRole userRole);

    List<Enrollment> findByCourseIdAndUserRoleAndIsDeletedFalse(UUID courseId, UserRole userRole);

    long countByIsDeletedFalse();

    List<Enrollment> findByStatusAndIsDeletedFalse(EnrollmentStatus status);

    List<Enrollment> findByUserIdAndStatusAndIsDeletedFalse(UUID userId, EnrollmentStatus status);

    @Query("SELECT e FROM Enrollment e WHERE e.isDeleted = true")
    List<Enrollment> findByIsDeletedTrue();

    @Query("SELECT e FROM Enrollment e WHERE e.courseId = :courseId AND e.isDeleted = true")
    List<Enrollment> findByCourseIdAndIsDeletedTrue(@Param("courseId") UUID courseId);
}
