package com.hasnain.cms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hasnain.cms.config.JwtService;
import com.hasnain.cms.dto.LoginDTO;
import com.hasnain.cms.dto.UserDTO;
import com.hasnain.cms.dto.UserRegistrationDTO;
import com.hasnain.cms.entity.User;
import com.hasnain.cms.exception.DuplicateIdentifierException;
import com.hasnain.cms.exception.InvalidCredentialsException;
import com.hasnain.cms.exception.InvalidIdentifierFormatException;
import com.hasnain.cms.exception.ResourceNotFoundException;
import com.hasnain.cms.security.SecurityUser;
import com.hasnain.cms.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatcher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = UserController.class,
        excludeAutoConfiguration = {UserDetailsServiceAutoConfiguration.class})
class UserControllerTest {

    @RestControllerAdvice
    static class TestSpecificAdvice {

        @ExceptionHandler(BadCredentialsException.class)
        public ResponseEntity<Map<String, String>> handleBadCredentials(BadCredentialsException ex) {
            // Return 401 explicitly
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid Credentials")); // Use a generic message
        }

        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<Map<String, String>> handleResourceNotFound(ResourceNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        }

        @ExceptionHandler(InvalidCredentialsException.class)
        public ResponseEntity<Map<String, String>> handleInvalidCredentials(InvalidCredentialsException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", ex.getMessage()));
        }

        @ExceptionHandler(DuplicateIdentifierException.class)
        public ResponseEntity<Map<String, String>> handleDuplicateIdentifier(DuplicateIdentifierException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
        }

        @ExceptionHandler(InvalidIdentifierFormatException.class)
        public ResponseEntity<Map<String, String>> handleInvalidIdentifierFormat(InvalidIdentifierFormatException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
        }
    }

    @TestConfiguration
    static class TestSecurityConfig {
        @Bean
        public SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
            http
                    .authorizeHttpRequests(auth -> auth
                            .requestMatchers("/api/auth/register", "/api/auth/login").permitAll()
                            .anyRequest().authenticated()
                    )
                    .httpBasic(AbstractHttpConfigurer::disable)
                    .csrf(AbstractHttpConfigurer::disable);

            return http.build();
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private AuthenticationManager authenticationManager;

    @MockBean
    private JwtService jwtService;

    private static final String VALID_EMAIL = "email@test.com";
    private static final String VALID_PHONE = "+92-315-6789608";
    private static final String INVALID_IDENTIFIER = "invalid_email_or_phone";
    private static final String RAW_PASSWORD = "password123";
    private static final String NEW_PASSWORD = "new_password";
    private static final String INCORRECT_PASSWORD = "incorrect_password";
    private static final String FAKE_TOKEN = "fake.jwt.token";

    private UserRegistrationDTO userRegistrationDTOWithEmail;
    private UserRegistrationDTO userRegistrationDTOWithPhone;
    private UserRegistrationDTO userRegistrationDTOInvalid;
    private LoginDTO loginDTOWithEmail;
    private LoginDTO loginDTOWithPhone;
    private LoginDTO loginDTOWithIncorrectPassword;
    private UserDTO userDTOWithEmail;
    private UserDTO userDTOWithPhone;
    private ChangePasswordRequest changePasswordRequestValid;
    private ChangePasswordRequest changePasswordRequestInvalidOldPass;
    private ChangePasswordRequest changePasswordRequestInvalidIdentifier;

    private UserDetails mockUserDetailsEmail;
    private UserDetails mockUserDetailsPhone;
    private Authentication mockAuthEmail;
    private Authentication mockAuthPhone;

    private record ChangePasswordRequest(String identifier, String oldPassword, String newPassword) {
    }

    @BeforeEach
    void setUp() {

        userRegistrationDTOWithEmail = new UserRegistrationDTO(VALID_EMAIL, RAW_PASSWORD);
        userRegistrationDTOWithPhone = new UserRegistrationDTO(VALID_PHONE, RAW_PASSWORD);
        userRegistrationDTOInvalid = new UserRegistrationDTO(INVALID_IDENTIFIER, RAW_PASSWORD);

        loginDTOWithEmail = new LoginDTO(VALID_EMAIL, RAW_PASSWORD);
        loginDTOWithPhone = new LoginDTO(VALID_PHONE, RAW_PASSWORD);
        loginDTOWithIncorrectPassword = new LoginDTO(VALID_EMAIL, INCORRECT_PASSWORD);

        userDTOWithEmail = new UserDTO(VALID_EMAIL, null);
        userDTOWithPhone = new UserDTO(null, VALID_PHONE);

        changePasswordRequestValid = new ChangePasswordRequest(VALID_EMAIL, RAW_PASSWORD, NEW_PASSWORD);
        changePasswordRequestInvalidOldPass = new ChangePasswordRequest(VALID_EMAIL, INCORRECT_PASSWORD, NEW_PASSWORD);
        changePasswordRequestInvalidIdentifier = new ChangePasswordRequest(INVALID_IDENTIFIER, RAW_PASSWORD, NEW_PASSWORD);

        User userEmail = new User();
        userEmail.setUserId(1L);
        userEmail.setEmail(VALID_EMAIL);
        mockUserDetailsEmail = new SecurityUser(userEmail);

        User userPhone = new User();
        userPhone.setUserId(2L);
        userPhone.setPhone(VALID_PHONE);
        mockUserDetailsPhone = new SecurityUser(userPhone);

        mockAuthEmail = new UsernamePasswordAuthenticationToken(
                mockUserDetailsEmail, null, mockUserDetailsEmail.getAuthorities());
        mockAuthPhone = new UsernamePasswordAuthenticationToken(
                mockUserDetailsPhone, null, mockUserDetailsPhone.getAuthorities());
    }

    private String asJsonString(final Object object) {
        try {
            return objectMapper.writeValueAsString(object);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private ArgumentMatcher<UsernamePasswordAuthenticationToken> tokenWithUsername(String username) {
        return token -> token != null && token.getName() != null &&
                token.getName().equals(username);
    }

    @Test
    void register_Success_Returns200AndUserDTO_Email() throws Exception {

        when(userService.registerUser(VALID_EMAIL, RAW_PASSWORD)).thenReturn(userDTOWithEmail);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(userRegistrationDTOWithEmail))
                        .with(anonymous()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.email").value(VALID_EMAIL));
    }

    @Test
    void register_Success_Returns200AndUserDTO_Phone() throws Exception {

        when(userService.registerUser(VALID_PHONE, RAW_PASSWORD)).thenReturn(userDTOWithPhone);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(userRegistrationDTOWithPhone))
                        .with(anonymous()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.phone").value(VALID_PHONE));
    }

    @Test
    void register_Failure_DuplicateEmail_Returns409Conflict() throws Exception {

        final String errorMessage = "Email already registered";

        when(userService.registerUser(anyString(), anyString()))
                .thenThrow(new DuplicateIdentifierException(errorMessage));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(userRegistrationDTOWithEmail))
                        .with(anonymous()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value(errorMessage));
    }

    @Test
    void register_Failure_DuplicatePhone_Returns409Conflict() throws Exception {

        final String errorMessage = "Phone already registered";

        when(userService.registerUser(anyString(), anyString()))
                .thenThrow(new DuplicateIdentifierException(errorMessage));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(userRegistrationDTOWithPhone))
                        .with(anonymous()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value(errorMessage));
    }

    @Test
    void register_Failure_InvalidIdentifierFormat_Returns400BadRequest() throws Exception {

        final String errorMessage = "Invalid identifier. Must be a valid email or phone number.";

        when(userService.registerUser(INVALID_IDENTIFIER, RAW_PASSWORD))
                .thenThrow(new InvalidIdentifierFormatException(errorMessage));
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(userRegistrationDTOInvalid))
                        .with(anonymous()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(errorMessage));

    }

    @Test
    void register_Failure_SpringValidationFails_Returns400BadRequest() throws Exception {

        UserRegistrationDTO invalidDTO = new UserRegistrationDTO(null, RAW_PASSWORD);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(invalidDTO))
                        .with(anonymous()))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.identifier").exists());
    }

    @Test
    void login_Success_Returns200AndToken_Email() throws Exception {

        when(authenticationManager.authenticate(
                argThat(tokenWithUsername(VALID_EMAIL))
        )).thenReturn(mockAuthEmail);
        when(userService.loadUserByUsername(VALID_EMAIL)).thenReturn(mockUserDetailsEmail);
        when(jwtService.generateToken(mockUserDetailsEmail)).thenReturn(FAKE_TOKEN);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(loginDTOWithEmail))
                        .with(anonymous()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.token").value(FAKE_TOKEN))
                .andExpect(jsonPath("$.username").value(VALID_EMAIL));
    }

    @Test
    void login_Success_Returns200AndUserDTO_Phone() throws Exception {

        when(authenticationManager.authenticate(
                argThat(tokenWithUsername(VALID_PHONE))
        )).thenReturn(mockAuthPhone);
        when(userService.loadUserByUsername(VALID_PHONE)).thenReturn(mockUserDetailsPhone);
        when(jwtService.generateToken(mockUserDetailsPhone)).thenReturn(FAKE_TOKEN);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(loginDTOWithPhone))
                        .with(anonymous()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.token").value(FAKE_TOKEN))
                .andExpect(jsonPath("$.username").value(VALID_PHONE));
    }

    @Test
    void login_Failure_UserNotFound_Returns401Unauthorized() throws Exception {

        when(authenticationManager.authenticate(
                any(UsernamePasswordAuthenticationToken.class)
        )).thenThrow(new BadCredentialsException("User not found!"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(loginDTOWithEmail))
                        .with(anonymous()))
                .andExpect(result -> assertInstanceOf(BadCredentialsException.class, result.getResolvedException()));
    }

    @Test
    void login_Failure_IncorrectPassword_Returns401Unauthorized() throws Exception {

        when(authenticationManager.authenticate(
                any(UsernamePasswordAuthenticationToken.class)
        )).thenThrow(new BadCredentialsException("Incorrect password!"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(loginDTOWithIncorrectPassword))
                        .with(anonymous()))
                .andExpect(result -> assertInstanceOf(BadCredentialsException.class, result.getResolvedException()));
    }

    @Test
    void changePassword_Success_Returns200Ok() throws Exception {

        when(userService.changeUserPassword(VALID_EMAIL, RAW_PASSWORD, NEW_PASSWORD))
                .thenReturn(true);

        mockMvc.perform(put("/api/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(changePasswordRequestValid))
                        .with(user(VALID_EMAIL)))
                .andExpect(status().isOk())
                .andExpect(content().string("Password changed successfully!"));
    }

    @Test
    void changePassword_Failure_IncorrectPassword_Returns401Unauthorized() throws Exception {

        final String errorMessage = "Old password is incorrect";

        when(userService.changeUserPassword(VALID_EMAIL, INCORRECT_PASSWORD, NEW_PASSWORD))
                .thenThrow(new InvalidCredentialsException(errorMessage));

        mockMvc.perform(put("/api/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(changePasswordRequestInvalidOldPass))
                        .with(user(VALID_EMAIL)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value(errorMessage));
    }

    @Test
    void changePassword_Failure_UserNotFound_Returns404NotFound() throws Exception {

        final String errorMessage = "User not found";
        final String identifier = "nonExistent@test.com";

        when(userService.changeUserPassword(anyString(), eq(RAW_PASSWORD), eq(NEW_PASSWORD)))
                .thenThrow(new ResourceNotFoundException(errorMessage));

        ChangePasswordRequest request = new ChangePasswordRequest(identifier, RAW_PASSWORD,
                NEW_PASSWORD);

        mockMvc.perform(put("/api/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(request))
                        .with(user(identifier)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value(errorMessage));

    }

    @Test
    void changePassword_Failure_InvalidIdentifierFormat_Returns400BadRequest() throws Exception {

        final String errorMessage = "Invalid identifier. Must be a valid email or phone number.";

        when(userService.changeUserPassword(INVALID_IDENTIFIER, RAW_PASSWORD, NEW_PASSWORD))
                .thenThrow(new InvalidIdentifierFormatException(errorMessage));

        mockMvc.perform(put("/api/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(changePasswordRequestInvalidIdentifier))
                        .with(user(INVALID_IDENTIFIER)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(errorMessage));
    }

}