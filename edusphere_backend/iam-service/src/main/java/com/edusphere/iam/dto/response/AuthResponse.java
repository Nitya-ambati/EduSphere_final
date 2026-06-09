package com.edusphere.iam.dto.response;

import com.edusphere.iam.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private UUID userId;
    private String email;
    private String firstName;
    private String lastName;
    private Role role;
    private String studentOrEmployeeId;
    private boolean passwordChangeRequired;
    private int streakDays;
    private int maxStreakDays;
}
