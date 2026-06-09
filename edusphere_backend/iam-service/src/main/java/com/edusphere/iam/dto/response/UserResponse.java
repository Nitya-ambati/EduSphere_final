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
public class UserResponse {
    private UUID userId;
    private String firstName;
    private String lastName;
    private String email;
    private Role role;
    private UUID departmentId;
    private String studentOrEmployeeId;
    private boolean active;
    private boolean deleted;
}
