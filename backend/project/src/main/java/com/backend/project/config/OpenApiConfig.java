package com.backend.project.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI campusFacilityOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Campus Facility Booking System API")
                        .version("1.0.0")
                        .description("""
                                REST API for the **Campus Facility Booking System**.
                                
                                Manage facility bookings, check slot availability, and handle user \
                                authentication with JWT.
                                
                                ## Authentication
                                Most endpoints require a valid JWT.  
                                1. Call **POST /api/auth/login** to receive a token.  
                                2. Click the **Authorize 🔒** button and enter `Bearer <your-token>`.
                                """)
                        .contact(new Contact()
                                .name("Campus Facility Admin")
                                .email("admin@campus.edu")))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter the JWT token obtained from POST /api/auth/login")));
    }
}
