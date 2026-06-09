package com.edusphere.course.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "syllabi")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Syllabus extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "syllabus_id")
    private UUID syllabusId;

    @Column(name = "course_id", nullable = false, unique = true)
    private UUID courseId;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "uploaded_by")
    private UUID uploadedBy;

    @Column(name = "version")
    private String version = "1.0";
}
