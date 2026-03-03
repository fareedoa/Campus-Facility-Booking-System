package com.backend.project.dto;

import com.backend.project.model.User;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "Request body for registering a new user")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @Schema(description = "Full name of the user", example = "Jane Doe")
    @NotBlank(message = "Name is required")
    private String name;

    @Schema(description = "Email address", example = "jane@campus.edu")
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @Schema(description = "Unique username (3–100 characters)", example = "janedoe")
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 100, message = "Username must be between 3 and 100 characters")
    private String username;

    @Schema(description = "Password (minimum 6 characters)", example = "securepassword")
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @Schema(description = "User role", example = "STUDENT",
            allowableValues = {"STUDENT", "STAFF", "ADMIN"})
    @NotNull(message = "Role is required")
    private User.Role role;
}
