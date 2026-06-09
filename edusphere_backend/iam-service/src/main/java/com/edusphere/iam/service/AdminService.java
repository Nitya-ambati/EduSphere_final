package com.edusphere.iam.service;

import com.edusphere.iam.dto.response.UserResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface AdminService {
    Map<String, Object> bulkOnboardUsers(MultipartFile file);
    List<UserResponse> getAllUsers();
    long countStudents();
    void deleteUser(java.util.UUID userId, java.util.UUID adminId);
    void reactivateUser(java.util.UUID userId, java.util.UUID adminId);
}
