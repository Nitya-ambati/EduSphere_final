package com.edusphere.analytics.repository;

import com.edusphere.analytics.entity.StudentProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StudentProgressRepository extends JpaRepository<StudentProgress, UUID> {

    List<StudentProgress> findByStudentIdOrderByEventTimestampDesc(UUID studentId);

    List<StudentProgress> findByCourseIdOrderByEventTimestampDesc(UUID courseId);

    List<StudentProgress> findByStudentIdAndCourseIdOrderByEventTimestampDesc(UUID studentId, UUID courseId);

    @Query("SELECT AVG(sp.score) FROM StudentProgress sp WHERE sp.courseId = :courseId AND sp.score IS NOT NULL AND sp.eventType = 'ASSIGNMENT_SUBMITTED'")
    Double findAverageScoreByCourseId(@Param("courseId") UUID courseId);

    @Query("SELECT AVG(sp.score) FROM StudentProgress sp WHERE sp.score IS NOT NULL AND sp.eventType = 'ASSIGNMENT_SUBMITTED'")
    Double findGlobalAverageScore();

    long countByEventType(String eventType);

    @Query("SELECT COUNT(DISTINCT sp.studentId) FROM StudentProgress sp")
    long countDistinctStudents();

    @Query("SELECT COUNT(DISTINCT sp.assignmentId) FROM StudentProgress sp WHERE sp.eventType = 'ASSIGNMENT_SUBMITTED' AND sp.assignmentId IS NOT NULL")
    long countDistinctSubmittedAssignments();

    @Query("SELECT COUNT(DISTINCT sp.studentId) FROM StudentProgress sp WHERE sp.courseId = :courseId")
    long countDistinctStudentsByCourseId(@Param("courseId") UUID courseId);
}
