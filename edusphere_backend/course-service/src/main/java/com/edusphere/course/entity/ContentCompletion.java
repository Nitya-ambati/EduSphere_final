package com.edusphere.course.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "content_completions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "content_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentCompletion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "content_id", nullable = false)
    private UUID contentId;

    @Column(name = "course_id", nullable = false)
    private UUID courseId;

    @Column(name = "completed_at", nullable = false)
    private LocalDateTime completedAt;
}
