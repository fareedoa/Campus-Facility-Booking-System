package com.backend.project.service;

import java.util.Optional;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.backend.project.model.User;

@Service
public class AuthenticationService {
    private final UserService userService;
    @Getter
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AuthenticationService(UserService userService, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
    }

    public Optional<User> authenticateUser(String username, String rawPassword) {
        Optional<User> userOpt = userService.getUserByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (rawPassword != null && !rawPassword.isEmpty() && passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
                userService.updateLastLogin(user);
                return Optional.of(user);
            }
        }
        return Optional.empty();
    }
}