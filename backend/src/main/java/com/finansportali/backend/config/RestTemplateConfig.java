package com.finansportali.backend.config;
import org.springframework.context.annotation.*;
import org.springframework.web.client.RestTemplate;
@Configuration
public class RestTemplateConfig {
    @Bean public RestTemplate restTemplate() { return new RestTemplate(); }
}
