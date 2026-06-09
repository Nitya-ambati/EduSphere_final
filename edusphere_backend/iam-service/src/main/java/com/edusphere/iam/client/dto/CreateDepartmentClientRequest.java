package com.edusphere.iam.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDepartmentClientRequest {
    private String departmentName;
    private String departmentCode;
    private String description;
}
