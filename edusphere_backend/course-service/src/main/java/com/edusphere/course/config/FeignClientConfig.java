package com.edusphere.course.config;

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
        return requestTemplate -> requestTemplate.header("X-Service-Key", serviceSecret);
    }
}
