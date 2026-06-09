package com.edusphere.course.repository;

import com.edusphere.course.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID> {

    Optional<Course> findByCourseCodeAndDeletedFalse(String courseCode);

    List<Course> findAllByDeletedFalseAndIsActiveTrue();

    List<Course> findAllByDeletedTrue();
}
