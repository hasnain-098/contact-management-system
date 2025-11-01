package com.hasnain.cms.controller;

import com.hasnain.cms.config.JwtService;
import com.hasnain.cms.dto.*;
import com.hasnain.cms.service.UserService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@CrossOrigin("http://localhost:5173")
@RequestMapping("/api/auth")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<UserDTO> register(@Valid @RequestBody UserRegistrationDTO userRegistrationDTO) {
        log.info("Attempting to register a new user with identifier: {}", userRegistrationDTO.getIdentifier());
        UserDTO registeredUser = userService.registerUser(userRegistrationDTO.getIdentifier(), userRegistrationDTO.getPassword());
        log.info("Successfully registered a new user: {}",
                registeredUser.getEmail() != null ? registeredUser.getEmail() : registeredUser.getPhone());
        return ResponseEntity.ok(registeredUser);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginDTO loginDTO) {
        log.info("User is attempting to log in with identifier: {}", loginDTO.getIdentifier());
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginDTO.getIdentifier(), loginDTO.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        String token = jwtService.generateToken(userDetails);

        log.info("User '{}' is logged in successfully. Token generated.", userDetails.getUsername());
        return ResponseEntity.ok(new AuthResponseDTO(token, userDetails.getUsername()));
    }

    @PutMapping("/change-password")
    public ResponseEntity<String> changePassword(@Valid @RequestBody ChangePasswordDTO changePasswordDTO,
                                                  @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized: No valid token provided.");
        }

        log.info("User '{}' is attempting to change their password.", userDetails.getUsername());
        boolean success = userService.changeUserPassword(userDetails.getUsername(), changePasswordDTO.getOldPassword(),
                changePasswordDTO.getNewPassword());
        if (success) {
            log.info("User '{}' successfully changed their password.", userDetails.getUsername());
            return ResponseEntity.ok("Password changed successfully!");
        } else {
            log.warn("Password change failed for user '{}'.", userDetails.getUsername());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Password change failed");
        }
    }
}