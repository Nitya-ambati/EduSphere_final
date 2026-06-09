package com.edusphere.assignment.config;

import feign.RequestInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignClientConfig {

    @Value("${app.service.secret}")
    private String serviceSecret;

    @Bean
    public RequestInterceptor serviceKeyInterceptor() {
        return template -> template.header("X-Service-Key", serviceSecret);
    }
}
