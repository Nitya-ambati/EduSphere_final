package com.edusphere.course.service;

import com.edusphere.course.dto.request.CreateCourseRequest;
import com.edusphere.course.dto.request.UpdateCourseRequest;
import com.edusphere.course.dto.response.CourseResponse;

import java.util.List;
import java.util.UUID;

public interface CourseService {
    CourseResponse createCourse(CreateCourseRequest request, UUID adminId);
    List<CourseResponse> getAllCourses();
    List<CourseResponse> getDeletedCourses();
    CourseResponse getCourseById(UUID courseId);
    CourseResponse updateCourse(UUID courseId, UpdateCourseRequest request, UUID adminId);
    void deleteCourse(UUID courseId, UUID adminId);
    void restoreCourse(UUID courseId, UUID adminId);
}
