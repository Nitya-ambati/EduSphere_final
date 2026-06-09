package com.edusphere.course.service;

import com.edusphere.course.dto.response.SyllabusResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface SyllabusService {
    SyllabusResponse uploadSyllabus(UUID courseId, MultipartFile file, UUID coordinatorId);
    SyllabusResponse getSyllabus(UUID courseId);
}
