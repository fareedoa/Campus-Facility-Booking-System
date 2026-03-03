package com.backend.project.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "Request body for logging in")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @Schema(description = "Username", example = "janedoe")
    @NotBlank(message = "Username is required")
    private String username;

    @Schema(description = "Password", example = "securepassword")
    @NotBlank(message = "Password is required")
    private String password;
}
