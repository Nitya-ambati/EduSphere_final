package com.edusphere.analytics.client.dto;

import lombok.Data;

@Data
public class ClientApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
}
