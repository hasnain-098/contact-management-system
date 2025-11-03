package com.hasnain.cms.service;

import com.hasnain.cms.dto.UserDTO;
import com.hasnain.cms.entity.User;
import com.hasnain.cms.exception.DuplicateIdentifierException;
import com.hasnain.cms.exception.InvalidCredentialsException;
import com.hasnain.cms.exception.InvalidIdentifierFormatException;
import com.hasnain.cms.repository.UserRepository;
import com.hasnain.cms.security.SecurityUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private static final String RAW_PASSWORD = "password123";
    private static final String ENCODED_PASSWORD = "encoded_password";
    private static final String VALID_EMAIL = "email@test.com";
    private static final String VALID_PHONE = "03156789608";
    private static final String INVALID_IDENTIFIER = "invalid_email_or_phone";

    private User userWithEmail;
    private User userWithPhone;

    @BeforeEach
    void setUp() {

        userWithEmail = new User();
        userWithEmail.setUserId(1L);
        userWithEmail.setEmail(VALID_EMAIL);
        userWithEmail.setPassword(ENCODED_PASSWORD);

        userWithPhone = new User();
        userWithPhone.setUserId(2L);
        userWithPhone.setPhone(VALID_PHONE);
        userWithPhone.setPassword(ENCODED_PASSWORD);
    }

    @Test
    void loadUserByUsername_Success_WithEmail() {
        when(userRepository.findByEmail(VALID_EMAIL)).thenReturn(Optional.of(userWithEmail));

        UserDetails userDetails = userService.loadUserByUsername(VALID_EMAIL);

        assertNotNull(userDetails);
        assertInstanceOf(SecurityUser.class, userDetails);
        assertEquals(VALID_EMAIL, userDetails.getUsername());
        assertEquals(userWithEmail.getPassword(), userDetails.getPassword());
    }

    @Test
    void loadUserByUsername_Success_WithPhone() {
        when(userRepository.findByPhone(VALID_PHONE)).thenReturn(Optional.of(userWithPhone));

        UserDetails userDetails = userService.loadUserByUsername(VALID_PHONE);

        assertNotNull(userDetails);
        assertInstanceOf(SecurityUser.class, userDetails);
        assertEquals(VALID_PHONE, userDetails.getUsername());
        assertEquals(userWithPhone.getPassword(), userDetails.getPassword());
    }

    @Test
    void loadUserByUsername_Failure_InvalidIdentifier() {

        String expectedError = "Invalid identifier. Must be a valid email or phone number.";

        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> userService.loadUserByUsername(INVALID_IDENTIFIER)
        );

        assertEquals(expectedError, exception.getMessage());
    }

    @Test
    void loadUserByUsername_Failure_UserNotFound_Email() {

        String expectedError = "User not found with identifier: " + VALID_EMAIL;

        when(userRepository.findByEmail(VALID_EMAIL)).thenReturn(Optional.empty());

        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> userService.loadUserByUsername(VALID_EMAIL)
        );

        assertEquals(expectedError, exception.getMessage());
    }

    @Test
    void loadUserByUsername_Failure_UserNotFound_Phone() {

        String expectedError = "User not found with identifier: " + VALID_PHONE;

        when(userRepository.findByPhone(VALID_PHONE)).thenReturn(Optional.empty());

        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> userService.loadUserByUsername(VALID_PHONE)
        );

        assertEquals(expectedError, exception.getMessage());
    }

    @Test
    void registerUser_Success_ValidNewEmail() {

        when(passwordEncoder.encode(RAW_PASSWORD)).thenReturn(ENCODED_PASSWORD);
        when(userRepository.findByEmail(VALID_EMAIL)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(userWithEmail);

        UserDTO result = userService.registerUser(VALID_EMAIL, RAW_PASSWORD);

        assertNotNull(result);
        assertEquals(VALID_EMAIL, result.getEmail());
        assertNull(result.getPhone());

        verify(userRepository, times(1)).findByEmail(VALID_EMAIL);
        verify(userRepository, times(1)).save(any(User.class));
        verify(userRepository, never()).findByPhone(anyString());
    }

    @Test
    void registerUser_Success_ValidNewPhone() {

        when(passwordEncoder.encode(RAW_PASSWORD)).thenReturn(ENCODED_PASSWORD);
        when(userRepository.findByPhone(VALID_PHONE)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(userWithPhone);

        UserDTO result = userService.registerUser(VALID_PHONE, RAW_PASSWORD);

        assertNotNull(result);
        assertEquals(VALID_PHONE, result.getPhone());
        assertNull(result.getEmail());

        verify(userRepository, times(1)).findByPhone(VALID_PHONE);
        verify(userRepository, times(1)).save(any(User.class));
        verify(userRepository, never()).findByEmail(anyString());
    }

    @Test
    void registerUser_Failure_DuplicateEmail() {

        when(userRepository.findByEmail(VALID_EMAIL)).thenReturn(Optional.of(userWithEmail));

        assertThrows(DuplicateIdentifierException.class, () ->
                userService.registerUser(VALID_EMAIL, RAW_PASSWORD)
        );

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerUser_Failure_DuplicatePhone() {

        when(userRepository.findByPhone(VALID_PHONE)).thenReturn(Optional.of(userWithPhone));

        assertThrows(DuplicateIdentifierException.class, () ->
                userService.registerUser(VALID_PHONE, RAW_PASSWORD)
        );

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerUser_Failure_InvalidIdentifierFormat() {

        assertThrows(InvalidIdentifierFormatException.class, () ->
                userService.registerUser(INVALID_IDENTIFIER, RAW_PASSWORD)
        );

        verify(userRepository, never()).findByEmail(anyString());
        verify(userRepository, never()).findByPhone(anyString());
    }

    @Test
    void loginUser_Success_Email() {

        when(userRepository.findByEmail(VALID_EMAIL)).thenReturn(Optional.of(userWithEmail));
        when(passwordEncoder.matches(RAW_PASSWORD, ENCODED_PASSWORD)).thenReturn(true);

        UserDTO result = userService.loginUser(VALID_EMAIL, RAW_PASSWORD);

        assertNotNull(result);
        assertEquals(VALID_EMAIL, result.getEmail());
        assertNull(result.getPhone());

        verify(passwordEncoder, times(1)).matches(RAW_PASSWORD, ENCODED_PASSWORD);
    }

    @Test
    void loginUser_Success_Phone() {

        when(userRepository.findByPhone(VALID_PHONE)).thenReturn(Optional.of(userWithPhone));
        when(passwordEncoder.matches(RAW_PASSWORD, ENCODED_PASSWORD)).thenReturn(true);

        UserDTO result = userService.loginUser(VALID_PHONE, RAW_PASSWORD);

        assertNotNull(result);
        assertEquals(VALID_PHONE, result.getPhone());
        assertNull(result.getEmail());

        verify(passwordEncoder, times(1)).matches(RAW_PASSWORD, ENCODED_PASSWORD);
    }

    @Test
    void loginUser_Failure_IncorrectPassword_Email() {

        when(userRepository.findByEmail(VALID_EMAIL)).thenReturn(Optional.of(userWithEmail));
        when(passwordEncoder.matches(RAW_PASSWORD, ENCODED_PASSWORD)).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () ->
                userService.loginUser(VALID_EMAIL, RAW_PASSWORD)
        );

        verify(passwordEncoder, times(1)).matches(RAW_PASSWORD, ENCODED_PASSWORD);
    }

    @Test
    void loginUser_Failure_IncorrectPassword_Phone() {

        when(userRepository.findByPhone(VALID_PHONE)).thenReturn(Optional.of(userWithPhone));
        when(passwordEncoder.matches(RAW_PASSWORD, ENCODED_PASSWORD)).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () ->
                userService.loginUser(VALID_PHONE, RAW_PASSWORD)
        );

        verify(passwordEncoder, times(1)).matches(RAW_PASSWORD, ENCODED_PASSWORD);
    }

    @Test
    void loginUser_Failure_InvalidIdentifierFormat() {

        assertThrows(UsernameNotFoundException.class, () ->
                userService.loginUser(INVALID_IDENTIFIER, RAW_PASSWORD)
        );

        verify(userRepository, never()).findByEmail(anyString());
        verify(userRepository, never()).findByPhone(anyString());
    }

    @Test
    void loginUser_Failure_UserNotFound_Email() {

        when(userRepository.findByEmail(VALID_EMAIL)).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () ->
                userService.loginUser(VALID_EMAIL, RAW_PASSWORD)
        );

        verify(userRepository, times(1)).findByEmail(VALID_EMAIL);
        verify(userRepository, never()).findByPhone(anyString());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void loginUser_Failure_UserNotFound_Phone() {

        when(userRepository.findByPhone(VALID_PHONE)).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () ->
                userService.loginUser(VALID_PHONE, RAW_PASSWORD)
        );

        verify(userRepository, never()).findByEmail(anyString());
        verify(userRepository, times(1)).findByPhone(VALID_PHONE);
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void changeUserPassword_Success_Email() {

        final String NEW_PASSWORD = "new_password123";
        final String ENCODED_NEW_PASSWORD = "new_encoded_password";
        when(passwordEncoder.encode(NEW_PASSWORD)).thenReturn(ENCODED_NEW_PASSWORD);

        when(userRepository.findByEmail(VALID_EMAIL)).thenReturn(Optional.of(userWithEmail));
        when(passwordEncoder.matches(RAW_PASSWORD, ENCODED_PASSWORD)).thenReturn(true);


        boolean success = userService.changeUserPassword(VALID_EMAIL, RAW_PASSWORD, NEW_PASSWORD);

        assertTrue(success);

        verify(userRepository, times(1)).save(argThat(user ->
                user.getPassword().equals(ENCODED_NEW_PASSWORD)));
    }

    @Test
    void changeUserPassword_Success_Phone() {

        final String NEW_PASSWORD = "new_password123";
        final String ENCODED_NEW_PASSWORD = "new_encoded_password";
        when(passwordEncoder.encode(NEW_PASSWORD)).thenReturn(ENCODED_NEW_PASSWORD);

        when(userRepository.findByPhone(VALID_PHONE)).thenReturn(Optional.of(userWithPhone));
        when(passwordEncoder.matches(RAW_PASSWORD, ENCODED_PASSWORD)).thenReturn(true);


        boolean success = userService.changeUserPassword(VALID_PHONE, RAW_PASSWORD, NEW_PASSWORD);

        assertTrue(success);

        verify(userRepository, times(1)).save(argThat(user ->
                user.getPassword().equals(ENCODED_NEW_PASSWORD)));
    }

    @Test
    void changeUserPassword_Failure_IncorrectOldPassword_Email() {

        when(userRepository.findByEmail(VALID_EMAIL)).thenReturn(Optional.of(userWithEmail));
        when(passwordEncoder.matches(RAW_PASSWORD, ENCODED_PASSWORD)).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () ->
                userService.changeUserPassword(VALID_EMAIL, RAW_PASSWORD, "new_password")
        );

        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void changeUserPassword_Failure_IncorrectOldPassword_Phone() {

        when(userRepository.findByPhone(VALID_PHONE)).thenReturn(Optional.of(userWithPhone));
        when(passwordEncoder.matches(RAW_PASSWORD, ENCODED_PASSWORD)).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () ->
                userService.changeUserPassword(VALID_PHONE, RAW_PASSWORD, "new_password")
        );

        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void changeUserPassword_Failure_InvalidIdentifierFormat() {

        assertThrows(UsernameNotFoundException.class, () ->
                userService.changeUserPassword(INVALID_IDENTIFIER, RAW_PASSWORD, "new_password")
        );

        verify(userRepository, never()).findByEmail(anyString());
        verify(userRepository, never()).findByPhone(anyString());
    }

    @Test
    void changeUserPassword_Failure_UserNotFound_Email() {

        when(userRepository.findByEmail(VALID_EMAIL)).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () ->
                userService.changeUserPassword(VALID_EMAIL, RAW_PASSWORD, "new_password")
        );

        verify(userRepository, times(1)).findByEmail(VALID_EMAIL);
        verify(userRepository, never()).findByPhone(anyString());
        verify(userRepository, never()).save(any(User.class));
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void changeUserPassword_Failure_UserNotFound_Phone() {

        when(userRepository.findByPhone(VALID_PHONE)).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () ->
                userService.changeUserPassword(VALID_PHONE, RAW_PASSWORD, "new_password")
        );

        verify(userRepository, never()).findByEmail(anyString());
        verify(userRepository, times(1)).findByPhone(VALID_PHONE);
        verify(userRepository, never()).save(any(User.class));
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }
}
