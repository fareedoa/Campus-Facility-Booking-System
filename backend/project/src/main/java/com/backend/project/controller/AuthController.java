package com.backend.project.controller;

import com.backend.project.dto.LoginRequest;
import com.backend.project.dto.RegisterRequest;
import com.backend.project.model.User;
import com.backend.project.service.AuthenticationService;
import com.backend.project.service.JwtService;
import com.backend.project.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private static final String JWT_COOKIE_NAME = "next-auth.session-token";

    private final AuthenticationService authenticationService;
    private final JwtService jwtService;
    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
            @Valid @RequestBody RegisterRequest request) {

        // Check if username already exists
        if (userService.getUserByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Username already exists"));
        }

        // Check if email already exists
        if (userService.getUserByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Email already exists"));
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setUsername(request.getUsername());
        user.setPasswordHash(authenticationService.getPasswordEncoder().encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setIsActive(true);

        User savedUser = userService.createUser(user);

        logger.info("New user registered: {}", savedUser.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "User registered successfully",
                "user", Map.of(
                        "id", savedUser.getId(),
                        "username", savedUser.getUsername(),
                        "name", savedUser.getName(),
                        "email", savedUser.getEmail(),
                        "role", savedUser.getRole().name()
                )
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {

        Optional<User> userOpt = authenticationService.authenticateUser(
                request.getUsername(), request.getPassword());

        if (userOpt.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "Invalid username or password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        User user = userOpt.get();
        String token = jwtService.generateToken(user);

        // Set JWT as HttpOnly cookie
        Cookie jwtCookie = new Cookie(JWT_COOKIE_NAME, token);
        jwtCookie.setHttpOnly(true);
        jwtCookie.setSecure(true);
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge(3600); // 1 hour
        response.addCookie(jwtCookie);

        Map<String, Object> body = new HashMap<>();
        body.put("message", "Login successful");
        body.put("token", token);
        body.put("user", Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole().name()
        ));

        logger.info("User logged in: {}", user.getUsername());
        return ResponseEntity.ok(body);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            HttpServletRequest request,
            HttpServletResponse response) {

        // Extract token from cookie or header and blacklist it
        String token = extractToken(request);
        if (token != null) {
            jwtService.blacklistToken(token);
        }

        // Clear the JWT cookie
        Cookie clearCookie = new Cookie(JWT_COOKIE_NAME, null);
        clearCookie.setHttpOnly(true);
        clearCookie.setSecure(true);
        clearCookie.setPath("/");
        clearCookie.setMaxAge(0);
        response.addCookie(clearCookie);

        logger.info("User logged out");
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(HttpServletRequest request) {
        String token = extractToken(request);
        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Not authenticated"));
        }

        try {
            String username = jwtService.extractUsername(token);
            String role = jwtService.extractRole(token);
            String email = jwtService.extractEmailFromToken(token);

            if (username == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid token"));
            }

            Map<String, Object> user = new HashMap<>();
            user.put("username", username);
            user.put("role", role);
            user.put("email", email);

            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid or expired token"));
        }
    }

    private String extractToken(HttpServletRequest request) {
        // Try cookie first
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (JWT_COOKIE_NAME.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        // Fallback to Authorization header
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }
}
