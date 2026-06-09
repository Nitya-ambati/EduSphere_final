package com.edusphere.course.repository;

import com.edusphere.course.entity.CourseContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CourseContentRepository extends JpaRepository<CourseContent, UUID> {

    List<CourseContent> findByCourseIdAndDeletedFalseOrderBySequenceNumber(UUID courseId);
}
