package com.hasnain.contactsuite.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class LoginDTO {

    @NotBlank(message = "email or phone number is required.")
    private String identifier;

    @NotBlank(message = "password is required.")
    private String password;
}
