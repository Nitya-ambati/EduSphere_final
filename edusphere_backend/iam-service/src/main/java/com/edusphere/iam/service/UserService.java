package com.edusphere.iam.service;

import com.edusphere.iam.dto.response.UserResponse;
import com.edusphere.iam.entity.User;

import java.util.Optional;
import java.util.UUID;

public interface UserService {
    UserResponse getUser(UUID userId);
    UserResponse updateUser(UUID userId, String firstName, String lastName);
    void deactivateUser(UUID userId);
    Optional<UserResponse> lookupByStudentOrEmployeeId(String studentOrEmployeeId);
}
