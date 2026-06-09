package com.edusphere.iam.serviceImpl;

import com.edusphere.iam.client.AuditServiceClient;
import com.edusphere.iam.client.NotificationServiceClient;
import com.edusphere.iam.client.dto.AuditLogRequest;
import com.edusphere.iam.client.dto.DispatchNotificationRequest;
import com.edusphere.iam.dto.request.*;
import com.edusphere.iam.dto.response.AuthResponse;
import com.edusphere.iam.entity.OtpToken;
import com.edusphere.iam.entity.RefreshToken;
import com.edusphere.iam.entity.User;
import com.edusphere.iam.exception.CustomException;
import com.edusphere.iam.repository.*;
import com.edusphere.iam.security.JwtUtil;
import com.edusphere.iam.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OtpTokenRepository otpTokenRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final AuditServiceClient auditServiceClient;
    private final NotificationServiceClient notificationServiceClient;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletResponse response) {
        User user = userRepository.findByEmailAndDeletedFalse(request.getEmail())
                .orElseThrow(() -> new CustomException("Invalid email or password", HttpStatus.UNAUTHORIZED));

        if (!user.isActive()) {
            throw new CustomException("Account is deactivated", HttpStatus.FORBIDDEN);
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new CustomException("Invalid email or password", HttpStatus.UNAUTHORIZED);
        }

        String accessToken = jwtUtil.generateAccessToken(user.getUserId(), user.getEmail(), user.getRole().name());
        generateAndStoreRefreshToken(user.getUserId(), response);

        // Update login streak
        LocalDate today = LocalDate.now();
        LocalDate lastLogin = user.getLastLoginDate();
        if (lastLogin == null || lastLogin.isBefore(today.minusDays(1))) {
            user.setStreakDays(1);
        } else if (lastLogin.equals(today.minusDays(1))) {
            user.setStreakDays(user.getStreakDays() + 1);
        }
        // Same day login: keep streak unchanged
        // Update max streak if current streak exceeds it
        if (user.getStreakDays() > user.getMaxStreakDays()) {
            user.setMaxStreakDays(user.getStreakDays());
        }
        user.setLastLoginDate(today);
        userRepository.save(user);

        try {
            auditServiceClient.createLog(AuditLogRequest.builder()
                    .actorId(user.getUserId())
                    .actorRole(user.getRole().name())
                    .action("USER_LOGIN")
                    .resourceType("USER")
                    .resourceId(user.getUserId().toString())
                    .serviceName("iam-service")
                    .build());
        } catch (Exception e) {
            log.warn("Failed to create audit log for USER_LOGIN: {}", e.getMessage());
        }

        return AuthResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .userId(user.getUserId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .studentOrEmployeeId(user.getStudentOrEmployeeId())
                .passwordChangeRequired(user.isTempPasswordChangeRequired())
                .streakDays(user.getStreakDays())
                .maxStreakDays(user.getMaxStreakDays())
                .build();
    }

    @Override
    @Transactional
    public AuthResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        String rawToken = extractRefreshTokenFromCookie(request);
        String tokenHash = hashToken(rawToken);

        RefreshToken stored = refreshTokenRepository.findByTokenHashAndRevokedFalse(tokenHash)
                .orElseThrow(() -> new CustomException("Invalid or expired refresh token", HttpStatus.UNAUTHORIZED));

        if (stored.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new CustomException("Refresh token expired, please login again", HttpStatus.UNAUTHORIZED);
        }

        User user = userRepository.findById(stored.getUserId())
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        String newAccessToken = jwtUtil.generateAccessToken(user.getUserId(), user.getEmail(), user.getRole().name());
        generateAndStoreRefreshToken(user.getUserId(), response);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .tokenType("Bearer")
                .userId(user.getUserId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .build();
    }

    @Override
    @Transactional
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        UUID loggedOutUserId = null;
        String loggedOutRole = null;
        try {
            String rawToken = extractRefreshTokenFromCookie(request);
            String tokenHash = hashToken(rawToken);
            java.util.Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByTokenHashAndRevokedFalse(tokenHash);
            if (tokenOpt.isPresent()) {
                RefreshToken t = tokenOpt.get();
                loggedOutUserId = t.getUserId();
                t.setRevoked(true);
                refreshTokenRepository.save(t);
                userRepository.findById(loggedOutUserId).ifPresent(u -> {
                    // role stored for audit
                });
                User u = userRepository.findById(loggedOutUserId).orElse(null);
                if (u != null) loggedOutRole = u.getRole().name();
            }
        } catch (Exception ignored) {}

        if (loggedOutUserId != null) {
            final UUID auditUserId = loggedOutUserId;
            final String auditRole = loggedOutRole != null ? loggedOutRole : "UNKNOWN";
            try {
                auditServiceClient.createLog(AuditLogRequest.builder()
                        .actorId(auditUserId)
                        .actorRole(auditRole)
                        .action("USER_LOGOUT")
                        .resourceType("USER")
                        .resourceId(auditUserId.toString())
                        .serviceName("iam-service")
                        .build());
            } catch (Exception e) {
                log.warn("Failed to create audit log for USER_LOGOUT: {}", e.getMessage());
            }
        }

        Cookie cookie = new Cookie("refresh_token", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmailAndDeletedFalse(request.getEmail())
                .orElseThrow(() -> new CustomException("No account found with this email", HttpStatus.NOT_FOUND));

        String otp = generateOtp();
        String otpHash = hashToken(otp);

        OtpToken otpToken = OtpToken.builder()
                .userId(user.getUserId())
                .otpHash(otpHash)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .used(false)
                .createdAt(LocalDateTime.now())
                .build();
        otpTokenRepository.save(otpToken);

        // Console log for dev/support traceability
        log.info("[PASSWORD_RESET_OTP] OTP generated for email={} | OTP={} | Expires in 10 minutes", user.getEmail(), otp);

        try {
            notificationServiceClient.dispatch(DispatchNotificationRequest.builder()
                    .userId(user.getUserId())
                    .recipientEmail(user.getEmail())
                    .eventType("PASSWORD_RESET_OTP")
                    .title("EduSphere Password Reset OTP")
                    .body("Your OTP for password reset is: " + otp + "\nThis OTP is valid for 10 minutes.")
                    .build());
            log.info("[PASSWORD_RESET_OTP] Email dispatched successfully to email={}", user.getEmail());
        } catch (Exception e) {
            log.warn("[PASSWORD_RESET_OTP] Failed to send OTP email to email={}: {}", user.getEmail(), e.getMessage());
        }
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmailAndDeletedFalse(request.getEmail())
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        String otpHash = hashToken(request.getOtp());
        OtpToken otp = otpTokenRepository
                .findByOtpHashAndUsedFalseAndExpiresAtAfter(otpHash, LocalDateTime.now())
                .orElseThrow(() -> new CustomException("Invalid or expired OTP", HttpStatus.BAD_REQUEST));

        if (!otp.getUserId().equals(user.getUserId())) {
            throw new CustomException("OTP does not match this account", HttpStatus.BAD_REQUEST);
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setTempPasswordChangeRequired(false);
        userRepository.save(user);

        otp.setUsed(true);
        otpTokenRepository.save(otp);

        refreshTokenRepository.revokeAllByUserId(user.getUserId());

        log.info("[PASSWORD_RESET] Password reset successfully for email={}", user.getEmail());

        try {
            notificationServiceClient.dispatch(DispatchNotificationRequest.builder()
                    .userId(user.getUserId())
                    .recipientEmail(user.getEmail())
                    .eventType("PASSWORD_CHANGED")
                    .title("EduSphere Password Changed")
                    .body("Your password has been successfully reset. If you did not do this, contact admin immediately.")
                    .build());
            log.info("[PASSWORD_RESET] Confirmation email dispatched to email={}", user.getEmail());
        } catch (Exception e) {
            log.warn("[PASSWORD_RESET] Failed to send password-changed email to email={}: {}", user.getEmail(), e.getMessage());
        }
    }

    @Override
    @Transactional
    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new CustomException("Current password is incorrect", HttpStatus.BAD_REQUEST);
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setTempPasswordChangeRequired(false);
        userRepository.save(user);

        refreshTokenRepository.revokeAllByUserId(user.getUserId());

        log.info("[CHANGE_PASSWORD] Password changed successfully for userId={} email={}", user.getUserId(), user.getEmail());

        try {
            notificationServiceClient.dispatch(DispatchNotificationRequest.builder()
                    .userId(user.getUserId())
                    .recipientEmail(user.getEmail())
                    .eventType("PASSWORD_CHANGED")
                    .title("EduSphere Password Changed")
                    .body("Your EduSphere password has been changed. If you did not do this, contact admin immediately.")
                    .build());
            log.info("[CHANGE_PASSWORD] Confirmation email dispatched to email={}", user.getEmail());
        } catch (Exception e) {
            log.warn("[CHANGE_PASSWORD] Failed to send password-changed email to email={}: {}", user.getEmail(), e.getMessage());
        }
    }

    @Override
    public boolean validateToken(String token) {
        return jwtUtil.isTokenValid(token);
    }

    private String generateAndStoreRefreshToken(UUID userId, HttpServletResponse response) {
        String rawToken = UUID.randomUUID().toString() + UUID.randomUUID();
        String tokenHash = hashToken(rawToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .userId(userId)
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshExpirationMs / 1000))
                .revoked(false)
                .createdAt(LocalDateTime.now())
                .build();
        refreshTokenRepository.save(refreshToken);

        Cookie cookie = new Cookie("refresh_token", rawToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // set true in production (HTTPS)
        cookie.setPath("/");
        cookie.setMaxAge((int) (refreshExpirationMs / 1000));
        response.addCookie(cookie);

        return rawToken;
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            throw new CustomException("Refresh token not found", HttpStatus.UNAUTHORIZED);
        }
        return Arrays.stream(request.getCookies())
                .filter(c -> "refresh_token".equals(c.getName()))
                .findFirst()
                .map(Cookie::getValue)
                .orElseThrow(() -> new CustomException("Refresh token not found", HttpStatus.UNAUTHORIZED));
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes());
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Hashing failed", e);
        }
    }

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        return String.format("%06d", random.nextInt(1000000));
    }
}
