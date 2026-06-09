package com.edusphere.iam.serviceImpl;

import com.edusphere.iam.client.AuditServiceClient;
import com.edusphere.iam.client.CourseServiceClient;
import com.edusphere.iam.client.NotificationServiceClient;
import com.edusphere.iam.client.dto.AuditLogRequest;
import com.edusphere.iam.client.dto.ClientApiResponse;
import com.edusphere.iam.client.dto.CreateDepartmentClientRequest;
import com.edusphere.iam.client.dto.DepartmentDto;
import com.edusphere.iam.client.dto.DispatchNotificationRequest;
import com.edusphere.iam.dto.response.UserResponse;
import com.edusphere.iam.entity.User;
import com.edusphere.iam.enums.Role;
import com.edusphere.iam.exception.CustomException;
import com.edusphere.iam.repository.UserRepository;
import com.edusphere.iam.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.security.SecureRandom;
import java.util.*;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditServiceClient auditServiceClient;
    private final NotificationServiceClient notificationServiceClient;
    private final CourseServiceClient courseServiceClient;

    private static final String CHARS = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
    private static final java.util.regex.Pattern EMAIL_PATTERN =
            java.util.regex.Pattern.compile("^[\\w._%+\\-]+@[\\w.\\-]+\\.[a-zA-Z]{2,}$");

    @Override
    @Transactional
    public Map<String, Object> bulkOnboardUsers(MultipartFile file) {
        if (file.isEmpty()) {
            throw new CustomException("Upload file is empty", HttpStatus.BAD_REQUEST);
        }

        List<UserResponse> created = new ArrayList<>();
        List<UserResponse> updated = new ArrayList<>();
        List<Map<String, String>> errors = new ArrayList<>();
        List<String> notificationFailures = new ArrayList<>();
        Map<String, UUID> deptCache = new ConcurrentHashMap<>();

        try (InputStream is = file.getInputStream(); Workbook wb = new XSSFWorkbook(is)) {
            Sheet sheet = wb.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String firstName = getCellValue(row, 0);
                String lastName = getCellValue(row, 1);
                String email = getCellValue(row, 2);
                String roleStr = getCellValue(row, 3);
                String deptCode = getCellValue(row, 4);
                String empStudentId = getCellValue(row, 5);

                if (email == null || email.isBlank()) continue;

                // Validate email format
                if (!EMAIL_PATTERN.matcher(email).matches()) {
                    errors.add(Map.of("row", String.valueOf(i + 1), "email", email,
                            "reason", "Invalid email address format: '" + email + "'"));
                    continue;
                }

                Role role;
                try {
                    role = Role.valueOf(roleStr != null ? roleStr.trim().toUpperCase() : "");
                } catch (Exception e) {
                    errors.add(Map.of("row", String.valueOf(i + 1), "email", email,
                            "reason", "Invalid role: '" + roleStr + "'. Must be STUDENT, INSTRUCTOR, COORDINATOR, or ADMIN."));
                    continue;
                }

                // Resolve or auto-create department
                UUID departmentId = null;
                if (deptCode != null && !deptCode.isBlank()) {
                    String normalizedCode = deptCode.trim().toUpperCase();
                    departmentId = deptCache.get(normalizedCode);
                    if (departmentId == null) {
                        departmentId = resolveOrCreateDepartment(normalizedCode, deptCache);
                    }
                    if (departmentId == null && (role == Role.STUDENT || role == Role.INSTRUCTOR)) {
                        errors.add(Map.of("row", String.valueOf(i + 1), "email", email,
                                "reason", "Could not resolve or create department '" + deptCode + "'."));
                        continue;
                    }
                } else if (role == Role.STUDENT || role == Role.INSTRUCTOR) {
                    errors.add(Map.of("row", String.valueOf(i + 1), "email", email,
                            "reason", "Department code is required for STUDENT and INSTRUCTOR roles."));
                    continue;
                }

                // Check if user already exists (including soft-deleted)
                Optional<User> existingOpt = userRepository.findByEmail(email);
                if (existingOpt.isPresent()) {
                    User existing = existingOpt.get();
                    boolean changed = false;

                    if (existing.isDeleted() || !existing.isActive()) {
                        existing.setDeleted(false);
                        existing.setActive(true);
                        changed = true;
                    }

                    if (empStudentId != null && !empStudentId.isBlank()
                            && !empStudentId.equals(existing.getStudentOrEmployeeId())
                            && userRepository.existsByStudentOrEmployeeIdAndUserIdNot(empStudentId, existing.getUserId())) {
                        errors.add(Map.of("row", String.valueOf(i + 1), "email", email,
                                "reason", "Student/employee ID '" + empStudentId + "' is already assigned to another user."));
                        continue;
                    }

                    if (firstName != null && !firstName.isBlank() && !firstName.equals(existing.getFirstName())) {
                        existing.setFirstName(firstName); changed = true;
                    }
                    if (lastName != null && !lastName.isBlank() && !lastName.equals(existing.getLastName())) {
                        existing.setLastName(lastName); changed = true;
                    }
                    if (!role.equals(existing.getRole())) {
                        existing.setRole(role); changed = true;
                    }
                    if (departmentId != null && !departmentId.equals(existing.getDepartmentId())) {
                        existing.setDepartmentId(departmentId); changed = true;
                    }
                    if (empStudentId != null && !empStudentId.isBlank()
                            && !empStudentId.equals(existing.getStudentOrEmployeeId())) {
                        existing.setStudentOrEmployeeId(empStudentId); changed = true;
                    }

                    if (changed) {
                        userRepository.save(existing);
                        boolean notifSent = sendAccountUpdatedEmail(existing.getUserId(), email,
                                existing.getFirstName() != null ? existing.getFirstName() : firstName);
                        if (!notifSent) notificationFailures.add(email);
                    }

                    updated.add(UserResponse.builder()
                            .userId(existing.getUserId())
                            .firstName(existing.getFirstName()).lastName(existing.getLastName())
                            .email(email).role(existing.getRole())
                            .departmentId(existing.getDepartmentId())
                            .studentOrEmployeeId(existing.getStudentOrEmployeeId()).active(existing.isActive())
                            .build());
                    continue;
                }

                // NEW user — check for duplicate studentOrEmployeeId
                if (empStudentId != null && !empStudentId.isBlank()
                        && userRepository.existsByStudentOrEmployeeId(empStudentId)) {
                    errors.add(Map.of("row", String.valueOf(i + 1), "email", email,
                            "reason", "Student/employee ID '" + empStudentId + "' is already taken."));
                    continue;
                }

                String tempPassword = generateTempPassword();
                User user = User.builder()
                        .firstName(firstName)
                        .lastName(lastName)
                        .email(email)
                        .passwordHash(passwordEncoder.encode(tempPassword))
                        .role(role)
                        .departmentId(departmentId)
                        .studentOrEmployeeId(empStudentId)
                        .active(true)
                        .tempPasswordChangeRequired(true)
                        .build();
                User saved = userRepository.save(user);

                boolean notifSent = sendOnboardingEmail(saved.getUserId(), email, firstName, tempPassword);
                if (!notifSent) notificationFailures.add(email);

                created.add(UserResponse.builder()
                        .userId(saved.getUserId())
                        .firstName(firstName).lastName(lastName)
                        .email(email).role(role)
                        .departmentId(departmentId)
                        .studentOrEmployeeId(empStudentId).active(true)
                        .build());
            }
        } catch (CustomException ce) {
            throw ce;
        } catch (Exception e) {
            throw new CustomException("Failed to process Excel file: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalCreated", created.size());
        result.put("totalUpdated", updated.size());
        result.put("totalErrors", errors.size());
        result.put("totalNotificationFailures", notificationFailures.size());
        result.put("createdUsers", created);
        result.put("updatedUsers", updated);
        result.put("errorRows", errors);
        result.put("notificationFailures", notificationFailures);
        return result;
    }

    @Override
    @Transactional
    public void deleteUser(UUID userId, UUID adminId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
        user.setDeleted(true);
        user.setActive(false);
        userRepository.save(user);

        try {
            auditServiceClient.createLog(AuditLogRequest.builder()
                    .actorId(adminId)
                    .actorRole("ADMIN")
                    .action("USER_DELETED")
                    .resourceType("USER")
                    .resourceId(userId.toString())
                    .serviceName("iam-service")
                    .additionalData("Deleted user email: " + user.getEmail())
                    .build());
        } catch (Exception e) {
            log.warn("Failed to create audit log for USER_DELETED: {}", e.getMessage());
        }
    }

    @Override
    @Transactional
    public void reactivateUser(UUID userId, UUID adminId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
        user.setDeleted(false);
        user.setActive(true);
        userRepository.save(user);
        try {
            auditServiceClient.createLog(AuditLogRequest.builder()
                    .actorId(adminId)
                    .actorRole("ADMIN")
                    .action("USER_REACTIVATED")
                    .resourceType("USER")
                    .resourceId(userId.toString())
                    .serviceName("iam-service")
                    .additionalData("Reactivated user email: " + user.getEmail())
                    .build());
        } catch (Exception e) {
            log.warn("Failed to create audit log for USER_REACTIVATED: {}", e.getMessage());
        }
    }

    @Override
    public long countStudents() {
        // Count all users with STUDENT role — matches admin dashboard behaviour
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.STUDENT)
                .count();
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> UserResponse.builder()
                        .userId(u.getUserId()).firstName(u.getFirstName()).lastName(u.getLastName())
                        .email(u.getEmail()).role(u.getRole()).departmentId(u.getDepartmentId())
                        .studentOrEmployeeId(u.getStudentOrEmployeeId()).active(u.isActive())
                        .deleted(u.isDeleted())
                        .build())
                .collect(Collectors.toList());
    }

    private String getCellValue(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default -> null;
        };
    }

    private String generateTempPassword() {
        SecureRandom rng = new SecureRandom();
        return rng.ints(12, 0, CHARS.length())
                .mapToObj(i -> String.valueOf(CHARS.charAt(i)))
                .collect(Collectors.joining());
    }

    private UUID resolveOrCreateDepartment(String deptCode, Map<String, UUID> cache) {
        try {
            ClientApiResponse<DepartmentDto> resp = courseServiceClient.getDepartmentByCode(deptCode);
            if (resp != null && resp.isSuccess() && resp.getData() != null) {
                UUID id = resp.getData().getDepartmentId();
                cache.put(deptCode, id);
                return id;
            }
        } catch (Exception e) {
            log.debug("Department '{}' not found, will auto-create: {}", deptCode, e.getMessage());
        }
        try {
            ClientApiResponse<DepartmentDto> created = courseServiceClient.createDepartment(
                    CreateDepartmentClientRequest.builder()
                            .departmentName(deptCode)
                            .departmentCode(deptCode)
                            .build());
            if (created != null && created.isSuccess() && created.getData() != null) {
                UUID id = created.getData().getDepartmentId();
                cache.put(deptCode, id);
                log.info("Auto-created department '{}' with id {}", deptCode, id);
                return id;
            }
        } catch (Exception e) {
            log.warn("Failed to auto-create department '{}': {}", deptCode, e.getMessage());
        }
        return null;
    }

    private boolean sendAccountUpdatedEmail(UUID userId, String email, String firstName) {
        try {
            notificationServiceClient.dispatch(DispatchNotificationRequest.builder()
                    .userId(userId)
                    .recipientEmail(email)
                    .eventType("USER_ONBOARDED")
                    .title("EduSphere Account Updated")
                    .body("Dear " + firstName + ",\n\n"
                            + "Your EduSphere account details have been updated by an administrator.\n\n"
                            + "If you have any questions, please contact your administrator.\n\n"
                            + "EduSphere Team")
                    .build());
            return true;
        } catch (Exception e) {
            log.warn("Failed to send account-updated email for {}: {}", email, e.getMessage());
            return false;
        }
    }

    private boolean sendOnboardingEmail(UUID userId, String email, String firstName, String tempPassword) {
        // Console log for admin/support — shows temp credentials for verification
        log.info("[USER_ONBOARDED] New account created | email={} | firstName={} | tempPassword={} | userId={}",
                email, firstName, tempPassword, userId);
        try {
            notificationServiceClient.dispatch(DispatchNotificationRequest.builder()
                    .userId(userId)
                    .recipientEmail(email)
                    .eventType("USER_ONBOARDED")
                    .title("Welcome to EduSphere!")
                    .body("Dear " + firstName + ",\n\n"
                            + "Your EduSphere account has been created.\n\n"
                            + "Login URL: http://localhost:3000/login\n"
                            + "Email: " + email + "\n"
                            + "Temporary Password: " + tempPassword + "\n\n"
                            + "Please change your password immediately after first login.\n\n"
                            + "EduSphere Team")
                    .build());
            log.info("[USER_ONBOARDED] Onboarding email dispatched to email={}", email);
            return true;
        } catch (Exception e) {
            log.warn("[USER_ONBOARDED] Failed to send onboarding email to email={}: {}", email, e.getMessage());
            return false;
        }
    }
}
