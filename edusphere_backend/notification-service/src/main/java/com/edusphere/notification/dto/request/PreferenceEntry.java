package com.edusphere.notification.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreferenceEntry {

    private String eventType;
    private boolean emailEnabled;
}
