package com.edusphere.notification.dto.response;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreferenceResponse {

    private UUID prefId;
    private UUID userId;
    private String eventType;
    private boolean emailEnabled;
}
