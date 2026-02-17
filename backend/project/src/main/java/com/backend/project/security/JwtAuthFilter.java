package com.backend.project.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.annotation.Nonnull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.backend.project.service.JwtService;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final UserDetailsServiceImpl userDetailsService;
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);
    private final JwtService jwtService;

    @Autowired
    public JwtAuthFilter(JwtService jwtService, UserDetailsServiceImpl userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    private static final String JWT_COOKIE_NAME = "next-auth.session-token";

    @Override
    protected void doFilterInternal(@Nonnull HttpServletRequest request,
                                    @Nonnull HttpServletResponse response,
                                    @Nonnull FilterChain filterChain) throws ServletException, IOException {

        String token = null;
        boolean tokenFromCookie = false;

        // Try to get token from cookies
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            Optional<Cookie> jwtCookie = Arrays.stream(cookies)
                    .filter(cookie -> JWT_COOKIE_NAME.equals(cookie.getName()))
                    .findFirst();

            if (jwtCookie.isPresent()) {
                token = jwtCookie.get().getValue();
                tokenFromCookie = true;
            }
        }

        // Fallback to Authorization header if cookie not found
        if (token == null) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
        }

        if (token != null && tokenLooksValid(token)) {
            boolean isValid = processToken(token, request);

            // If token is invalid/expired and came from cookie, clear it
            if (!isValid && tokenFromCookie) {
                clearJwtCookie(response);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setHeader("X-Token-Expired", "true");
                logger.info("Cleared expired/invalid JWT cookie");
            }
        }

        filterChain.doFilter(request, response);
    }

    private void clearJwtCookie(HttpServletResponse response) {
        Cookie clearCookie = new Cookie(JWT_COOKIE_NAME, null);
        clearCookie.setPath("/");
        clearCookie.setHttpOnly(true);
        clearCookie.setSecure(true);
        clearCookie.setMaxAge(0);
        response.addCookie(clearCookie);
    }

    private boolean tokenLooksValid(String token) {
        // Basic validation: should have 3 parts separated by "."
        return token.trim().split("\\.").length == 3;
    }

    private boolean processToken(String token, HttpServletRequest request) {
        try {
            String username = jwtService.extractUsername(token);
            if (jwtService.isTokenBlacklisted(token)) {
                logger.warn("Token is blacklisted: {}", token);
                return false;
            }

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                if (jwtService.isTokenValid(token, userDetails)) {
                    logger.debug("Token is valid for user: {}", username);

                    List<GrantedAuthority> authorities = jwtService.extractAuthorities(token);

                    if (authorities.isEmpty()) {
                        authorities = new ArrayList<>(userDetails.getAuthorities());
                    }

                    logger.debug("User authorities: {}", authorities);

                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(userDetails, null, authorities);

                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    logger.debug("Authentication successful for user: {}", username);
                    return true;
                } else {
                    logger.debug("Token is invalid or expired for user: {}", username);
                    return false;
                }
            } return false;
        } catch (Exception e) {
            logger.error("Error processing token: {}", e.getMessage());
            return false;
        }
    }
}
