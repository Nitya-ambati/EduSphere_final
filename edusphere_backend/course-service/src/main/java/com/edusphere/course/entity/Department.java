package com.edusphere.course.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "departments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "dept_id")
    private UUID deptId;

    @Column(name = "dept_name", nullable = false)
    private String deptName;

    @Column(name = "dept_code", unique = true, nullable = false)
    private String deptCode;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}
