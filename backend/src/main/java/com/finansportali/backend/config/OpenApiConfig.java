package com.finansportali.backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI 3.0 / Swagger UI configuration.
 * <p>
 * Swagger UI: http://localhost:8080/swagger-ui/index.html
 * OpenAPI JSON: http://localhost:8080/v3/api-docs
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI finansPortaliOpenAPI() {
        final String securitySchemeName = "BearerAuth";

        return new OpenAPI()
            .info(new Info()
                .title("Finans Portali API")
                .description("""
                    SAU 2026 - Türk Finans Portalı REST API.
                    Piyasa verileri, portföy yönetimi, haberler, AI tavsiyeleri ve daha fazlası.
                    Tüm endpoint'ler /api/v1/ prefix'i altındadır.
                    """)
                .version("v1.0.0")
                .contact(new Contact()
                    .name("SAU Finans Portali")
                    .email("pelinsumarinette@gmail.com"))
                .license(new License()
                    .name("MIT License")))
            .servers(List.of(
                new Server().url("http://localhost:8080").description("Local Development"),
                new Server().url("http://localhost:3000").description("Frontend Nginx Proxy")))
            .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
            .components(new Components()
                .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                    .name(securitySchemeName)
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("Keycloak JWT token. Obtain from: http://localhost:8180/realms/finans-portali/protocol/openid-connect/token")));
    }
}
