package com.edusphere.notification.dto.request;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePreferenceRequest {

    private List<PreferenceEntry> preferences;
}
