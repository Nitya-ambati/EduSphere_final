package com.edusphere.course.repository;

import com.edusphere.course.entity.Syllabus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SyllabusRepository extends JpaRepository<Syllabus, UUID> {

    Optional<Syllabus> findByCourseId(UUID courseId);
}
