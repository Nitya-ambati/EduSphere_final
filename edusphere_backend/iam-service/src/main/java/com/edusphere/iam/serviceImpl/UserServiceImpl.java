package com.edusphere.iam.serviceImpl;

import com.edusphere.iam.dto.response.UserResponse;
import com.edusphere.iam.entity.User;
import com.edusphere.iam.exception.CustomException;
import com.edusphere.iam.repository.UserRepository;
import com.edusphere.iam.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public UserResponse getUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
        return toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateUser(UUID userId, String firstName, String lastName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
        if (firstName != null) user.setFirstName(firstName);
        if (lastName != null) user.setLastName(lastName);
        return toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public void deactivateUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
        user.setActive(false);
        userRepository.save(user);
    }

    @Override
    public Optional<UserResponse> lookupByStudentOrEmployeeId(String studentOrEmployeeId) {
        return userRepository.findByStudentOrEmployeeIdAndDeletedFalse(studentOrEmployeeId)
                .map(this::toResponse);
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .userId(user.getUserId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole())
                .departmentId(user.getDepartmentId())
                .studentOrEmployeeId(user.getStudentOrEmployeeId())
                .active(user.isActive())
                .build();
    }
}
