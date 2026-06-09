package com.edusphere.course.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "course_id")
    private UUID courseId;

    @Column(name = "course_name", nullable = false)
    private String courseName;

    @Column(name = "course_code", unique = true, nullable = false)
    private String courseCode;

    @Column(name = "description")
    private String description;

    @Column(name = "enrollment_deadline")
    private LocalDate enrollmentDeadline;

    @Column(name = "completion_deadline")
    private LocalDate completionDeadline;

    @Column(name = "duration")
    private String duration;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_by_admin")
    private UUID createdByAdmin;
}
