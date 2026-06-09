package com.edusphere.notification.service.impl;

import com.edusphere.notification.client.IamServiceClient;
import com.edusphere.notification.client.dto.ClientApiResponse;
import com.edusphere.notification.client.dto.UserDto;
import com.edusphere.notification.dto.request.CourseCompletionNotificationRequest;
import com.edusphere.notification.dto.request.DispatchNotificationRequest;
import com.edusphere.notification.dto.request.PreferenceEntry;
import com.edusphere.notification.dto.request.UpdatePreferenceRequest;
import com.edusphere.notification.dto.response.NotificationResponse;
import com.edusphere.notification.dto.response.PreferenceResponse;
import com.edusphere.notification.entity.Notification;
import com.edusphere.notification.entity.NotificationPreference;
import com.edusphere.notification.enums.NotificationChannel;
import com.edusphere.notification.exception.CustomException;
import com.edusphere.notification.repository.NotificationPreferenceRepository;
import com.edusphere.notification.repository.NotificationRepository;
import com.edusphere.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final JavaMailSender mailSender;
    private final IamServiceClient iamServiceClient;

    @Value("${spring.mail.username}")
    private String mailFrom;

    private static final java.util.Set<String> OTP_EVENT_TYPES = java.util.Set.of(
            "PASSWORD_RESET_OTP", "OTP_SENT", "TEMP_PASSWORD", "OTP_GENERATED"
    );

    private boolean isOtpEvent(String eventType) {
        if (eventType == null) return false;
        String upper = eventType.toUpperCase();
        return upper.contains("OTP") || OTP_EVENT_TYPES.contains(upper);
    }

    @Override
    @Transactional
    public NotificationResponse dispatch(DispatchNotificationRequest request) {
        // OTP / security events are email-only — no in-app notification saved to DB
        if (isOtpEvent(request.getEventType())) {
            String recipientEmail = (request.getRecipientEmail() != null && !request.getRecipientEmail().isBlank())
                    ? request.getRecipientEmail()
                    : resolveUserEmail(request.getUserId());
            sendEmail(recipientEmail, request.getTitle(), request.getBody(), request.getUserId());
            return NotificationResponse.builder()
                    .userId(request.getUserId())
                    .eventType(request.getEventType())
                    .title(request.getTitle())
                    .body(request.getBody())
                    .channel(NotificationChannel.EMAIL)
                    .isRead(false)
                    .build();
        }

        Optional<NotificationPreference> prefOpt = preferenceRepository
                .findByUserIdAndEventType(request.getUserId(), request.getEventType());

        boolean emailEnabled = true;
        if (prefOpt.isPresent()) {
            emailEnabled = prefOpt.get().isEmailEnabled();
        }

        Notification notification = Notification.builder()
                .userId(request.getUserId())
                .eventType(request.getEventType())
                .title(request.getTitle())
                .body(request.getBody())
                .channel(request.getChannel() != null ? request.getChannel() : NotificationChannel.BOTH)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);

        NotificationChannel channel = notification.getChannel();
        boolean shouldSendEmail = (channel == NotificationChannel.EMAIL || channel == NotificationChannel.BOTH)
                && emailEnabled;

        if (shouldSendEmail) {
            String recipientEmail = (request.getRecipientEmail() != null && !request.getRecipientEmail().isBlank())
                    ? request.getRecipientEmail()
                    : resolveUserEmail(request.getUserId());
            sendEmail(recipientEmail, request.getTitle(), request.getBody(), request.getUserId());
        }

        return toNotificationResponse(notification);
    }

    private void sendEmail(String recipientEmail, String subject, String body, UUID userId) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(recipientEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent to {} for user {}", recipientEmail, userId);
        } catch (MailException e) {
            log.error("SMTP delivery failed for {} (user {}): {} — cause: {}",
                    recipientEmail, userId, e.getMessage(),
                    e.getCause() != null ? e.getCause().getMessage() : "none");
        } catch (Exception e) {
            log.error("Unexpected error sending email to {} (user {}): {}", recipientEmail, userId, e.getMessage(), e);
        }
    }

    @Override
    public List<NotificationResponse> getNotifications(UUID userId) {
        return notificationRepository.findByUserIdAndDeletedFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toNotificationResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findByNotificationIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new CustomException("Notification not found", HttpStatus.NOT_FOUND));

        notification.setRead(true);
        notification = notificationRepository.save(notification);
        return toNotificationResponse(notification);
    }

    @Override
    @Transactional
    public List<PreferenceResponse> updatePreferences(UUID userId, UpdatePreferenceRequest request) {
        if (request.getPreferences() == null) {
            return getPreferences(userId);
        }

        for (PreferenceEntry entry : request.getPreferences()) {
            Optional<NotificationPreference> existing = preferenceRepository
                    .findByUserIdAndEventType(userId, entry.getEventType());

            if (existing.isPresent()) {
                NotificationPreference pref = existing.get();
                pref.setEmailEnabled(entry.isEmailEnabled());
                preferenceRepository.save(pref);
            } else {
                NotificationPreference pref = NotificationPreference.builder()
                        .userId(userId)
                        .eventType(entry.getEventType())
                        .emailEnabled(entry.isEmailEnabled())
                        .build();
                preferenceRepository.save(pref);
            }
        }

        return getPreferences(userId);
    }

    @Override
    public List<PreferenceResponse> getPreferences(UUID userId) {
        return preferenceRepository.findByUserId(userId)
                .stream()
                .map(this::toPreferenceResponse)
                .collect(Collectors.toList());
    }

    @Override
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalseAndDeletedFalse(userId);
    }

    @Override
    @Transactional
    public void deleteNotification(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findByNotificationIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new CustomException("Notification not found", HttpStatus.NOT_FOUND));
        notification.setDeleted(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public NotificationResponse notifyCourseCompletion(CourseCompletionNotificationRequest request) {
        // Resolve student name and email from IAM service
        String displayName = request.getStudentName();
        String recipientEmail = null;
        try {
            ClientApiResponse<UserDto> userResp = iamServiceClient.getUser(request.getStudentId());
            if (userResp != null && userResp.isSuccess() && userResp.getData() != null) {
                UserDto u = userResp.getData();
                if (displayName == null || displayName.isBlank()) {
                    displayName = u.getFirstName() + " " + u.getLastName();
                }
                recipientEmail = u.getEmail();
            }
        } catch (Exception e) {
            log.warn("Could not resolve student info for course completion: {}", e.getMessage());
        }
        if (displayName == null || displayName.isBlank()) displayName = "Student";

        String title = "Congratulations! You completed \"" + request.getCourseTitle() + "\"";
        String inAppBody = "You have successfully completed all content in \"" + request.getCourseTitle() + "\". Great work!";

        // Save in-app notification
        Notification notification = Notification.builder()
                .userId(request.getStudentId())
                .eventType("COURSE_COMPLETED")
                .title(title)
                .body(inAppBody)
                .channel(NotificationChannel.BOTH)
                .isRead(false)
                .build();
        notification = notificationRepository.save(notification);

        // Send HTML certificate email
        final String finalEmail = (recipientEmail != null) ? recipientEmail
                : request.getStudentId() + "@edusphere.edu";
        final String finalName = displayName;
        final String courseTitle = request.getCourseTitle();
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            // multipart=true enables both plain-text fallback and HTML content (better deliverability)
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(finalEmail);
            helper.setSubject("Certificate of Completion - " + courseTitle);
            String certHtml = buildCertificateHtml(finalName, courseTitle);
            String plainText = "Congratulations " + finalName + "! You have successfully completed the course: "
                    + courseTitle + ". Your certificate is attached to this email.";
            helper.setText(plainText, certHtml);
            String safeTitle = courseTitle.replaceAll("[^a-zA-Z0-9_\\-]", "_");
            helper.addAttachment(
                    "Certificate_" + safeTitle + ".html",
                    new jakarta.mail.util.ByteArrayDataSource(
                            certHtml.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                            "text/html"
                    )
            );
            mailSender.send(mimeMessage);
            log.info("Certificate email sent to {} for course '{}'", finalEmail, courseTitle);
        } catch (Exception e) {
            log.error("Failed to send certificate email to {}: {}", finalEmail, e.getMessage());
        }

        return toNotificationResponse(notification);
    }

    private String buildCertificateHtml(String studentName, String courseTitle) {
        String date = java.time.LocalDate.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("MMMM d, yyyy"));
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'></head><body style='"
                + "margin:0;padding:0;background:#f0f4f8;font-family:Georgia,serif;'>"
                + "<div style='max-width:680px;margin:40px auto;background:#fff;"
                + "border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;'>"
                // Header banner
                + "<div style='background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:36px 40px;text-align:center;'>"
                + "<h1 style='color:#fff;margin:0;font-size:28px;letter-spacing:1px;'>🎓 EduSphere</h1>"
                + "<p style='color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;letter-spacing:2px;'>CERTIFICATE OF COMPLETION</p>"
                + "</div>"
                // Gold certificate body
                + "<div style='padding:48px 56px;text-align:center;border:6px solid transparent;"
                + "background:linear-gradient(#fff,#fff) padding-box,"
                + "linear-gradient(135deg,#f59e0b,#d97706) border-box;margin:24px;border-radius:8px;'>"
                + "<p style='color:#64748b;font-size:14px;margin:0 0 12px;'>THIS IS TO CERTIFY THAT</p>"
                + "<h2 style='color:#1e293b;font-size:34px;margin:0 0 8px;font-style:italic;'>"
                + escapeHtml(studentName) + "</h2>"
                + "<p style='color:#64748b;font-size:14px;margin:0 0 24px;'>has successfully completed the course</p>"
                + "<h3 style='color:#4f46e5;font-size:22px;margin:0 0 24px;border-bottom:2px solid #e2e8f0;"
                + "padding-bottom:20px;'>" + escapeHtml(courseTitle) + "</h3>"
                + "<p style='color:#94a3b8;font-size:13px;margin:0;'>Issued on <strong style='color:#64748b;'>"
                + date + "</strong></p>"
                + "<div style='margin-top:28px;'>"
                + "<span style='display:inline-block;background:linear-gradient(135deg,#10b981,#059669);"
                + "color:#fff;padding:8px 24px;border-radius:99px;font-size:13px;font-family:sans-serif;"
                + "letter-spacing:0.5px;'>✔ Course Completed</span>"
                + "</div></div>"
                // Footer
                + "<div style='padding:20px 40px;text-align:center;border-top:1px solid #f1f5f9;"
                + "background:#fafafa;'>"
                + "<p style='color:#94a3b8;font-size:12px;margin:0;font-family:sans-serif;'>"
                + "This certificate was automatically generated by <strong>EduSphere Learning Platform</strong>.<br>"
                + "Keep learning and growing!</p>"
                + "</div></div></body></html>";
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private String resolveUserEmail(UUID userId) {
        try {
            ClientApiResponse<UserDto> response = iamServiceClient.getUser(userId);
            if (response != null && response.isSuccess() && response.getData() != null) {
                return response.getData().getEmail();
            }
        } catch (Exception ex) {
            log.warn("Could not resolve email for userId {}: {}", userId, ex.getMessage());
        }
        return userId + "@edusphere.edu";
    }

    private NotificationResponse toNotificationResponse(Notification notification) {
        return NotificationResponse.builder()
                .notificationId(notification.getNotificationId())
                .userId(notification.getUserId())
                .eventType(notification.getEventType())
                .title(notification.getTitle())
                .body(notification.getBody())
                .isRead(notification.isRead())
                .channel(notification.getChannel())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    private PreferenceResponse toPreferenceResponse(NotificationPreference pref) {
        return PreferenceResponse.builder()
                .prefId(pref.getPrefId())
                .userId(pref.getUserId())
                .eventType(pref.getEventType())
                .emailEnabled(pref.isEmailEnabled())
                .build();
    }
}
