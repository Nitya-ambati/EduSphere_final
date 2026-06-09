package com.edusphere.analytics.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "student_progress")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentProgress extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "progress_id", updatable = false, nullable = false)
    private UUID progressId;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "course_id", nullable = false)
    private UUID courseId;

    @Column(name = "assignment_id")
    private UUID assignmentId;

    @Column(name = "content_id")
    private UUID contentId;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(name = "score")
    private Double score;

    @Column(name = "event_timestamp", nullable = false)
    private LocalDateTime eventTimestamp;
}
