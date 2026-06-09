package com.edusphere.course.dto.request;

import com.edusphere.course.enums.ContentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddContentRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Content type is required")
    private ContentType contentType;

    private String filePathOrUrl;
    private String body;
    private int sequenceNumber;
}
