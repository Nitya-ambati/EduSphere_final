package com.edusphere.assignment.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequest {
    private UUID userId;
    private String recipientEmail;
    private String title;
    private String message;
    private String body;
    private String eventType;
    private String channel;
}
