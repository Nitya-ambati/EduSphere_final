package com.edusphere.enrollment.dto.response;

import com.edusphere.enrollment.enums.EnrollmentStatus;
import com.edusphere.enrollment.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnrollmentResponse {

    private UUID enrollmentId;
    private UUID userId;
    private UUID courseId;
    private UserRole userRole;
    private LocalDateTime enrolledAt;
    private boolean isException;
    private EnrollmentStatus status;
}
