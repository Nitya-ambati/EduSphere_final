package com.edusphere.notification.service;

import com.edusphere.notification.dto.request.CourseCompletionNotificationRequest;
import com.edusphere.notification.dto.request.DispatchNotificationRequest;
import com.edusphere.notification.dto.request.UpdatePreferenceRequest;
import com.edusphere.notification.dto.response.NotificationResponse;
import com.edusphere.notification.dto.response.PreferenceResponse;

import java.util.List;
import java.util.UUID;

public interface NotificationService {

    NotificationResponse dispatch(DispatchNotificationRequest request);

    NotificationResponse notifyCourseCompletion(CourseCompletionNotificationRequest request);

    List<NotificationResponse> getNotifications(UUID userId);

    NotificationResponse markAsRead(UUID notificationId, UUID userId);

    List<PreferenceResponse> updatePreferences(UUID userId, UpdatePreferenceRequest request);

    List<PreferenceResponse> getPreferences(UUID userId);

    long getUnreadCount(UUID userId);

    void deleteNotification(UUID notificationId, UUID userId);
}
