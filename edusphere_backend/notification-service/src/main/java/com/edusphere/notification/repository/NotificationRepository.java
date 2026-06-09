package com.edusphere.notification.repository;

import com.edusphere.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByUserIdAndDeletedFalseOrderByCreatedAtDesc(UUID userId);

    long countByUserIdAndIsReadFalseAndDeletedFalse(UUID userId);

    Optional<Notification> findByNotificationIdAndUserId(UUID notificationId, UUID userId);
}
