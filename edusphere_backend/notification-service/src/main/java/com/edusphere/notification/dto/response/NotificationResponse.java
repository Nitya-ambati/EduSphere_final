package com.edusphere.notification.dto.response;

import com.edusphere.notification.enums.NotificationChannel;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {

    private UUID notificationId;
    private UUID userId;
    private String eventType;
    private String title;
    private String body;
    private boolean isRead;
    private NotificationChannel channel;
    private LocalDateTime createdAt;
}
