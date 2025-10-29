package com.hasnain.contactsuite.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserRegistrationDTO {

    @NotBlank(message = "email or phone number is required.")
    private String identifier;

    @NotBlank(message = "password is required.")
    private String password;

}
