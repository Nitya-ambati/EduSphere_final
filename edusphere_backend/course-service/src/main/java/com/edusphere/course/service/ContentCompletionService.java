package com.edusphere.course.service;

import com.edusphere.course.dto.response.CourseProgressResponse;

import java.util.UUID;

public interface ContentCompletionService {

    void markContentComplete(UUID studentId, UUID contentId, UUID courseId);

    CourseProgressResponse getCourseProgress(UUID studentId, UUID courseId);
}
