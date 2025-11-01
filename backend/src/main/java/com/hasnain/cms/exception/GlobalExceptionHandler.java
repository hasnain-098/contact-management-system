package com.hasnain.cms.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    private static final String ERROR = "error";

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(
            MethodArgumentNotValidException exception) {

        Map<String, String> errors = new HashMap<>();

        exception.getBindingResult().getAllErrors().forEach(error -> {
            String fieldPath = error instanceof FieldError ? ((FieldError) error).getField() : error.getObjectName();
            String defaultMessage = error.getDefaultMessage();

            String message = switch (defaultMessage) {
                case "must be a well-formed email address" -> "Invalid email format.";
                case "must not be blank" -> "This field cannot be blank.";
                default -> defaultMessage;
            };

            errors.put(fieldPath, message);
        });

        return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler({BadCredentialsException.class, UsernameNotFoundException.class})
    public ResponseEntity<Map<String, String>> handleAuthenticationException(AuthenticationException ex) {
        log.warn("Authentication failed: {}", ex.getMessage());
        String errorMessage = ex.getMessage() != null ? ex.getMessage() : "Invalid credentials.";
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(ERROR, errorMessage));
    }

    @ExceptionHandler({DuplicateIdentifierException.class, DuplicateContactException.class})
    public ResponseEntity<Map<String, String >> handleDuplicateIdentifier(RuntimeException exception) {
        Map<String, String> error = new HashMap<>();
        error.put(ERROR, exception.getMessage());
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleInvalidCredentials(InvalidCredentialsException exception) {
        Map<String, String> error = new HashMap<>();
        error.put(ERROR, exception.getMessage());
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(InvalidIdentifierFormatException.class)
    public ResponseEntity<Map<String, String>> handleInvalidIdentifierFormat(InvalidIdentifierFormatException exception) {
        Map<String, String> error = new HashMap<>();
        error.put(ERROR, exception.getMessage());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleResourceNotFound(ResourceNotFoundException exception) {
        Map<String, String> error = new HashMap<>();
        error.put(ERROR, exception.getMessage());
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<Map<String, String>> handleUnauthorizedAccess(UnauthorizedAccessException exception) {
        Map<String, String> error = new HashMap<>();
        error.put(ERROR, exception.getMessage());
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeExceptions(RuntimeException exception) {
        Map<String, String> error = new HashMap<>();
        error.put(ERROR, "An unexpected server error occurred.");
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericExceptions(Exception exception) {
        Map<String, String> error = new HashMap<>();
        error.put(ERROR, "A general server error occurred");
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
