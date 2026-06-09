package com.edusphere.course.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    String storeFile(String directory, String filename, MultipartFile file);
}
