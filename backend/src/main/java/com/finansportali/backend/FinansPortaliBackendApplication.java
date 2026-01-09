package com.finansportali.backend;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
@SpringBootApplication
@EnableAsync
public class FinansPortaliBackendApplication {
    public static void main(String[] args) { SpringApplication.run(FinansPortaliBackendApplication.class, args); }
}
