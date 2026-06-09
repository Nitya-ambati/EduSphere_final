package com.edusphere.course.serviceImpl;

import com.edusphere.course.dto.response.SyllabusResponse;
import com.edusphere.course.entity.Syllabus;
import com.edusphere.course.exception.CustomException;
import com.edusphere.course.repository.SyllabusRepository;
import com.edusphere.course.service.FileStorageService;
import com.edusphere.course.service.SyllabusService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SyllabusServiceImpl implements SyllabusService {

    private final SyllabusRepository syllabusRepository;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional
    public SyllabusResponse uploadSyllabus(UUID courseId, MultipartFile file, UUID coordinatorId) {
        String filename = courseId + "_" + file.getOriginalFilename();
        String filePath = fileStorageService.storeFile("uploads/syllabi", filename, file);
        Syllabus syllabus = syllabusRepository.findByCourseId(courseId)
                .orElse(Syllabus.builder().courseId(courseId).version("1.0").build());
        syllabus.setFilePath(filePath);
        syllabus.setUploadedBy(coordinatorId);
        return toResponse(syllabusRepository.save(syllabus));
    }

    @Override
    public SyllabusResponse getSyllabus(UUID courseId) {
        Syllabus s = syllabusRepository.findByCourseId(courseId)
                .orElseThrow(() -> new CustomException("Syllabus not found for this course", HttpStatus.NOT_FOUND));
        return toResponse(s);
    }

    private SyllabusResponse toResponse(Syllabus s) {
        return SyllabusResponse.builder()
                .syllabusId(s.getSyllabusId()).courseId(s.getCourseId())
                .filePath(s.getFilePath()).uploadedBy(s.getUploadedBy()).version(s.getVersion()).build();
    }
}
