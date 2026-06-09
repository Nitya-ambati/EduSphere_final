package com.edusphere.iam.entity;

import com.edusphere.iam.enums.Role;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id", updatable = false, nullable = false)
    private UUID userId;

    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;

    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role;

    @Column(name = "department_id")
    private UUID departmentId;

    /**
     * Stores a student ID (e.g. STU-001) or employee ID (e.g. EMP-003).
     * NOTE: The field name contains "Or" which breaks Spring Data JPA derived
     * query parsing. All repository methods for this field must use @Query.
     */
    @Column(name = "student_or_employee_id", unique = true, length = 50)
    private String studentOrEmployeeId;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "temp_password_change_required", nullable = false)
    private boolean tempPasswordChangeRequired = false;

    @Column(name = "streak_days", nullable = false)
    private int streakDays = 0;

    @Column(name = "max_streak_days", nullable = false)
    private int maxStreakDays = 0;

    @Column(name = "last_login_date")
    private LocalDate lastLoginDate;
}
