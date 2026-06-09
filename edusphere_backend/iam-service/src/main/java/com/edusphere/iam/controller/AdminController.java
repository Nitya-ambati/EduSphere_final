package com.edusphere.iam.controller;

import com.edusphere.iam.dto.response.ApiResponse;
import com.edusphere.iam.dto.response.UserResponse;
import com.edusphere.iam.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin operations — user onboarding and management")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @PostMapping(value = "/users/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Bulk onboard users via Excel file (Admin only)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> bulkUpload(
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success("Bulk onboarding complete", adminService.bulkOnboardUsers(file)));
    }

    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR', 'INSTRUCTOR')")
    @Operation(summary = "List all users (Admin/Coordinator/Instructor — read only for Coordinator and Instructor)")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllUsers()));
    }

    @DeleteMapping("/users/{userId}")
    @Operation(summary = "Soft-delete (deactivate) a registered user (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable java.util.UUID userId,
            @RequestHeader("X-User-Id") String adminId) {
        adminService.deleteUser(userId, java.util.UUID.fromString(adminId));
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }

    @PatchMapping("/users/{userId}/reactivate")
    @Operation(summary = "Re-activate a previously deactivated user (Admin only)")
    public ResponseEntity<ApiResponse<Void>> reactivateUser(
            @PathVariable java.util.UUID userId,
            @RequestHeader("X-User-Id") String adminId) {
        adminService.reactivateUser(userId, java.util.UUID.fromString(adminId));
        return ResponseEntity.ok(ApiResponse.success("User reactivated successfully", null));
    }
}
