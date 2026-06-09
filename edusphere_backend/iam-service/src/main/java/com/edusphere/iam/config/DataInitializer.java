package com.edusphere.iam.config;

import com.edusphere.iam.entity.User;
import com.edusphere.iam.enums.Role;
import com.edusphere.iam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL = "systemadmin.04@gmail.com";
    private static final String ADMIN_PASSWORD = "edusphere";

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // Re-activate any admin accounts that are incorrectly deactivated
        userRepository.findByEmail(ADMIN_EMAIL).ifPresentOrElse(existing -> {
            if (!existing.isActive() || existing.isDeleted()) {
                existing.setActive(true);
                existing.setDeleted(false);
                userRepository.save(existing);
                log.info("Re-activated existing admin account: {}", ADMIN_EMAIL);
            }
        }, () -> {
            // No admin user found — create a default one
            User admin = User.builder()
                    .firstName("System")
                    .lastName("Admin")
                    .email(ADMIN_EMAIL)
                    .passwordHash(passwordEncoder.encode(ADMIN_PASSWORD))
                    .role(Role.ADMIN)
                    .active(true)
                    .tempPasswordChangeRequired(true)
                    .build();
            userRepository.save(admin);
            log.info("Created default admin account: {} / {} (change this password immediately!)",
                    ADMIN_EMAIL, ADMIN_PASSWORD);
        });
    }
}
