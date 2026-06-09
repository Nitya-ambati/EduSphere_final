package com.edusphere.course.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyllabusResponse {

    private UUID syllabusId;
    private UUID courseId;
    private String filePath;
    private UUID uploadedBy;
    private String version;
}
