package com.edusphere.course.entity;

import com.edusphere.course.enums.ContentType;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "course_contents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseContent extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "content_id")
    private UUID contentId;

    @Column(name = "course_id", nullable = false)
    private UUID courseId;

    @Column(name = "title", nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type")
    private ContentType contentType;

    @Column(name = "file_path_or_url")
    private String filePathOrUrl;

    @Column(name = "body", columnDefinition = "TEXT")
    private String body;

    @Column(name = "added_by")
    private UUID addedBy;

    @Column(name = "sequence_number")
    private int sequenceNumber;
}
