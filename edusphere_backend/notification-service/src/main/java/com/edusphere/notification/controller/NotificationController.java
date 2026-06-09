package com.edusphere.notification.controller;

import com.edusphere.notification.dto.request.CourseCompletionNotificationRequest;
import com.edusphere.notification.dto.request.DispatchNotificationRequest;
import com.edusphere.notification.dto.request.UpdatePreferenceRequest;
import com.edusphere.notification.dto.response.ApiResponse;
import com.edusphere.notification.dto.response.NotificationResponse;
import com.edusphere.notification.dto.response.PreferenceResponse;
import com.edusphere.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Notification dispatch and preference management")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getNotifications(
            @RequestHeader("X-User-Id") UUID userId) {
        List<NotificationResponse> notifications = notificationService.getNotifications(userId);
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved successfully", notifications));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @RequestHeader("X-User-Id") UUID userId) {
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.success("Unread count retrieved", count));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(
            @PathVariable UUID notificationId,
            @RequestHeader("X-User-Id") UUID userId) {
        NotificationResponse response = notificationService.markAsRead(notificationId, userId);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", response));
    }

    @GetMapping("/preferences")
    public ResponseEntity<ApiResponse<List<PreferenceResponse>>> getPreferences(
            @RequestHeader("X-User-Id") UUID userId) {
        List<PreferenceResponse> preferences = notificationService.getPreferences(userId);
        return ResponseEntity.ok(ApiResponse.success("Preferences retrieved successfully", preferences));
    }

    @PostMapping("/preferences")
    public ResponseEntity<ApiResponse<List<PreferenceResponse>>> updatePreferences(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestBody @Valid UpdatePreferenceRequest request) {
        List<PreferenceResponse> preferences = notificationService.updatePreferences(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Preferences updated successfully", preferences));
    }

    @PostMapping("/dispatch")
    @Operation(summary = "Generic notification dispatch (internal / admin use)")
    public ResponseEntity<ApiResponse<NotificationResponse>> dispatch(
            @RequestBody @Valid DispatchNotificationRequest request) {
        NotificationResponse response = notificationService.dispatch(request);
        return ResponseEntity.ok(ApiResponse.success("Notification dispatched successfully", response));
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable UUID notificationId,
            @RequestHeader("X-User-Id") UUID userId) {
        notificationService.deleteNotification(notificationId, userId);
        return ResponseEntity.ok(ApiResponse.success("Notification deleted", null));
    }

    @PostMapping("/course-completion")
    @Operation(summary = "Send a course completion congratulation email to a student — called by course-service")
    public ResponseEntity<ApiResponse<NotificationResponse>> notifyCourseCompletion(
            @RequestBody @Valid CourseCompletionNotificationRequest request) {
        NotificationResponse response = notificationService.notifyCourseCompletion(request);
        return ResponseEntity.ok(ApiResponse.success("Course completion notification sent", response));
    }
}
