package com.edusphere.iam;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@EnableAsync
@EnableScheduling
public class IamServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(IamServiceApplication.class, args);
//        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
//       String plainPassword = "edusphere";
//
//       // Generate hash
//    String hash = encoder.encode(plainPassword);
//        System.out.println("Hashed Password: " + hash);
//
//    //    // Verify password
//       boolean isMatch = encoder.matches(plainPassword, hash);
//       System.out.println("Password Match: " + isMatch);
    }
}

