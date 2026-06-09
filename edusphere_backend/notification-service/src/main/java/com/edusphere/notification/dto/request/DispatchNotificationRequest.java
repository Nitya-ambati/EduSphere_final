package com.edusphere.notification.dto.request;

import com.edusphere.notification.enums.NotificationChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispatchNotificationRequest {

    @NotNull(message = "userId is required")
    private UUID userId;

    private String recipientEmail;

    @NotBlank(message = "eventType is required")
    private String eventType;

    @NotBlank(message = "title is required")
    private String title;

    @NotBlank(message = "body is required")
    private String body;

    private NotificationChannel channel = NotificationChannel.BOTH;
}
