package com.hasnain.cms.service;

import com.hasnain.cms.dto.UserDTO;
import com.hasnain.cms.entity.User;
import com.hasnain.cms.exception.DuplicateIdentifierException;
import com.hasnain.cms.exception.InvalidCredentialsException;
import com.hasnain.cms.exception.InvalidIdentifierFormatException;
import com.hasnain.cms.mapper.UserMapper;
import com.hasnain.cms.repository.UserRepository;
import com.hasnain.cms.security.SecurityUser;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        log.debug("Looking up user by identifier: {}", identifier);
        Optional<User> userOptional;

        if (UserService.isValidEmail(identifier)) {
            userOptional = userRepository.findByEmail(identifier);
        } else if (UserService.isValidPhone(identifier)) {
            userOptional = userRepository.findByPhone(identifier);
        } else {
            log.error("User lookup failed: Invalid identifier format: {}.", identifier);
            throw new UsernameNotFoundException("Invalid identifier. Must be a valid email or phone number.");
        }

        if (userOptional.isPresent()) {
            log.debug("User found with ID: {}, creating SecurityUser details.", userOptional.get().getUserId());
            return new SecurityUser(userOptional.get());
        } else {
            log.error("User lookup failed: User not found for identifier: {}", identifier);
            throw new UsernameNotFoundException("User not found with identifier: " + identifier);
        }
    }

    public UserDTO registerUser(String identifier, String password) {
        log.info("Attempting to register new user with identifier: {}", identifier);
        String email = null;
        String phone = null;

        if (isValidEmail(identifier)) {
            email = identifier;
            if (userRepository.findByEmail(email).isPresent()) {
                log.warn("Registration failed: Email already registered for identifier: {}", email);
                throw new DuplicateIdentifierException("Email already registered");
            }
        } else if (isValidPhone(identifier)) {
            phone = identifier;
            if (userRepository.findByPhone(phone).isPresent()) {
                log.warn("Registration failed: Phone already registered for identifier: {}", phone);
                throw new DuplicateIdentifierException("Phone already registered");
            }
        } else {
            log.error("Registration failed: Invalid identifier format for: {}", identifier);
            throw new InvalidIdentifierFormatException("Invalid identifier. Must be a valid email or phone number.");
        }


        String encodedPassword = passwordEncoder.encode(password);
        log.debug("Password for identifier '{}' has been encoded.", identifier);

        User user = new User();
        user.setEmail(email);
        user.setPhone(phone);
        user.setPassword(encodedPassword);

        User savedUser = userRepository.save(user);
        log.info("Successfully registered user with ID: {}", savedUser.getUserId());

        return UserMapper.toDTO(savedUser);
    }

    public UserDTO loginUser(String identifier, String password) {
        log.info("Attempting to login for user: {}", identifier);
        UserDetails userDetails = loadUserByUsername(identifier);

        if (passwordEncoder.matches(password, userDetails.getPassword())) {
            log.info("User '{}' logged in successfully.", identifier);
            if (userDetails instanceof SecurityUser securityUser) {
                User user = securityUser.getUser();
                return UserMapper.toDTO(user);
            } else {
                return new UserDTO(userDetails.getUsername(), null);
            }
        } else {
            log.warn("Login failed: Incorrect password for user '{}'.", identifier);
            throw new InvalidCredentialsException("Unable to login. Incorrect password.");
        }
    }

    @Transactional
    public boolean changeUserPassword(String identifier, String oldPassword, String newPassword) {
        log.info("Attempting to change password for user: {}", identifier);

        UserDetails userDetails = loadUserByUsername(identifier);
        User user = ((SecurityUser) userDetails).getUser();

        if (passwordEncoder.matches(oldPassword, user.getPassword())) {
            String encodedNewPassword = passwordEncoder.encode(newPassword);
            user.setPassword(encodedNewPassword);
            userRepository.save(user);
            log.info("Password successfully changed for user: {}", identifier);
            return true;
        } else {
            log.warn("Password change failed: Old password incorrect for user: {}", identifier);
            throw new InvalidCredentialsException("Old password is incorrect");
        }
    }

    public static boolean isValidEmail(String identifier) {
        return identifier != null && identifier.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    }

    public static boolean isValidPhone(String identifier) {
        return identifier != null && identifier.matches("^(?:\\+92-\\d{3}-\\d{7}|03\\d{9})$");
    }
}


