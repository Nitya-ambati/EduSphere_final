package com.edusphere.course.repository;

import com.edusphere.course.entity.ContentCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContentCompletionRepository extends JpaRepository<ContentCompletion, UUID> {

    boolean existsByStudentIdAndContentId(UUID studentId, UUID contentId);

    Optional<ContentCompletion> findByStudentIdAndContentId(UUID studentId, UUID contentId);

    List<ContentCompletion> findByStudentIdAndCourseId(UUID studentId, UUID courseId);

    long countByStudentIdAndCourseId(UUID studentId, UUID courseId);
}
