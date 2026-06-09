package com.edusphere.assignment.dto.response;

import com.edusphere.assignment.enums.AnswerOption;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnswerDetailResponse {

    private UUID questionId;
    private AnswerOption selectedOption;
    private boolean isCorrect;
    private AnswerOption correctOption;
}
