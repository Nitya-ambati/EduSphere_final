package com.edusphere.course.dto.response;

import com.edusphere.course.enums.ContentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseContentResponse {

    private UUID contentId;
    private UUID courseId;
    private String title;
    private ContentType contentType;
    private String filePathOrUrl;
    private String body;
    private UUID addedBy;
    private int sequenceNumber;
}
