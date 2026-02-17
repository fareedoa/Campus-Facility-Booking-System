package com.backend.project.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import com.backend.project.model.User;

import javax.crypto.SecretKey;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class JwtService {
    private static final Logger logger = LoggerFactory.getLogger(JwtService.class);

    @Value("${secret.key}")
    private String secretKey; // 256-bit key
    private static final long EXPIRATION_MS = 3600000L; // 1 hour

//    private final Key signingKey;

    private final Set<String> blacklistedTokens = ConcurrentHashMap.newKeySet();

    public JwtService() {
        // Key initialization deferred to getKey() using @Value-injected secretKey
    }

    private SecretKey getKey() {
        // Decode the Base64 string to get the raw key bytes
        byte[] keyBytes = Base64.getDecoder().decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Generate token using username as subject
     */
    public String generateToken(User user) {
        logger.info("Generating JWT token for user: {}", user.getUsername());

        Date now = new Date();
        Date expiry = new Date(now.getTime() + EXPIRATION_MS);

        // Use username as subject
        String subject = user.getUsername();

        logger.debug("Token issue time: {}, expiration time: {}", now, expiry);
        logger.debug("Using subject: {}", subject);

        String token = Jwts.builder()
                .setSubject(subject)
                .claim("role", user.getRole().name())
                .claim("userId", user.getUserId())
                .claim("email", user.getEmail())
                .claim("username", user.getUsername())
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getKey())
                .compact();

        logger.debug("Generated JWT token: {}", token);
        return token;
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        if (blacklistedTokens.contains(token)) {
            return false;
        }
        logger.info("Checking if token is valid for user: {}", userDetails.getUsername());
        final String tokenSubject = extractSubject(token);
        logger.debug("Extracted subject from token: {}", tokenSubject);
        boolean isValid = (tokenSubject != null && tokenSubject.equals(userDetails.getUsername()) && !isTokenExpired(token));
        logger.debug("Token validity: {}", isValid);
        return isValid;
    }

    public String extractUsername(String token) {
        logger.info("Extracting username from token...");
        try {
            Claims claims = extractAllClaims(token);
            String username = null;
            if (claims.get("username") != null) {
                username = claims.get("username", String.class);
                logger.debug("Found username in 'username' claim: {}", username);
            } else if (claims.get("email") != null) {
                username = claims.get("email", String.class);
                logger.debug("Found username in 'email' claim: {}", username);
            } else if (claims.get("name") != null) {
                username = claims.get("name", String.class);
                logger.debug("Found username in 'name' claim: {}", username);
            } else {
                username = claims.getSubject(); // fallback
                logger.debug("Found username in 'subject' claim: {}", username);
            }
            logger.info("Extracted username: {}", username);
            return username;
        } catch (JwtException e) {
            logger.error("JWT Exception: {}", e.getMessage());
            return null;
        } catch (IllegalArgumentException e) {
            logger.error("Illegal Argument Exception: {}", e.getMessage());
            return null;
        }
    }

    public String extractSubject(String token) {
        logger.debug("Extracting subject from token...");
        try {
            Claims claims = extractAllClaims(token);
            String subject = claims.getSubject();
            logger.debug("Extracted subject: {}", subject);
            return subject;
        } catch (JwtException e) {
            logger.error("JWT Exception: {}", e.getMessage());
            return null;
        } catch (IllegalArgumentException e) {
            logger.error("Illegal Argument Exception: {}", e.getMessage());
            return null;
        }
    }

    public String extractEmailFromToken(String token) {
        logger.debug("Extracting email from token...");
        try {
            Claims claims = extractAllClaims(token);
            String email = claims.get("email", String.class);
            logger.debug("Extracted email: {}", email);
            return email;
        } catch (JwtException e) {
            logger.error("JWT Exception: {}", e.getMessage());
            return null;
        } catch (IllegalArgumentException e) {
            logger.error("Illegal Argument Exception: {}", e.getMessage());
            return null;
        }
    }

    public String extractRole(String token) {
        logger.debug("Extracting role from token...");
        try {
            Claims claims = extractAllClaims(token);
            String role = claims.get("role", String.class);
            logger.debug("Extracted role: {}", role);
            return role;
        } catch (JwtException e) {
            logger.error("JWT Exception: {}", e.getMessage());
            return null;
        } catch (IllegalArgumentException e) {
            logger.error("Illegal Argument Exception: {}", e.getMessage());
            return null;
        }
    }

    public List<GrantedAuthority> extractAuthorities(String token) {
        logger.info("Extracting authorities from token...");
        List<GrantedAuthority> authorities = new ArrayList<>();
        try {
            Claims claims = extractAllClaims(token);
            if (claims.get("role") != null) {
                String role = claims.get("role", String.class);
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
                logger.debug("Extracted role from token: {}", role);
            }
        } catch (JwtException e) {
            logger.error("JWT Exception: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("Illegal Argument Exception: {}", e.getMessage());
        }
        logger.debug("Extracted authorities: {}", authorities);
        return authorities;
    }

    private Claims extractAllClaims(String token) {
        logger.debug("Extracting all claims from token. Token: {}", token);
        try {
            return Jwts.parser()
                    .verifyWith(getKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            logger.error("Token expired: {}", e.getMessage());
            throw e;
        } catch (MalformedJwtException e) {
            logger.error("Malformed token: {}", e.getMessage());
            throw e;
        } catch (JwtException e) {
            logger.error("JWT Exception: {}", e.getMessage());
            throw e;
        }
    }

    private boolean isTokenExpired(String token) {
        logger.info("Checking if token is expired...");
        try {
            Claims claims = extractAllClaims(token);
            Date expiration = claims.getExpiration();
            logger.debug("Token expiration time: {}", expiration);
            boolean isExpired = expiration.before(new Date());
            logger.debug("Token expired: {}", isExpired);
            return isExpired;
        } catch (JwtException e) {
            logger.error("JWT Exception: {}", e.getMessage());
            return true; // assume expired if any parsing issue
        } catch (IllegalArgumentException e) {
            logger.error("Illegal Argument Exception: {}", e.getMessage());
            return true;
        }
    }

    public void invalidateToken(String token) {
        blacklistedTokens.add(token);
    }

    public boolean isTokenBlacklisted(String token) {
        return blacklistedTokens.contains(token);
    }
    public void blacklistToken(String token) {
        blacklistedTokens.add(token);
    }
}