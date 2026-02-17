package com.backend.project.security;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;

import com.backend.project.model.User;
import com.backend.project.repository.UserRepository;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        // Find user by username only
        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isEmpty()) {
            throw new UsernameNotFoundException("User not found with username: " + username);
        }

        User user = userOpt.get();

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new UsernameNotFoundException("User is not active: " + username);
        }

        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        String roleWithPrefix = "ROLE_" + user.getRole().name();
        authorities.add(new SimpleGrantedAuthority(roleWithPrefix));

        // Use username as principal name
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(), user.getPasswordHash(), user.getIsActive(), true, true, true, authorities);
    }
}