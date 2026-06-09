package com.edusphere.enrollment.client.dto;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispatchNotificationRequest {

    private UUID userId;
    private String recipientEmail;
    private String eventType;
    private String title;
    private String body;
    private String channel;
}
