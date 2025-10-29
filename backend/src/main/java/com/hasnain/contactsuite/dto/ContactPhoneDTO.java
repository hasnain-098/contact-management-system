package com.hasnain.contactsuite.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ContactPhoneDTO {

    private Long id;

    @NotBlank(message = "Phone label is required")
    private String label;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^(?:\\+92-\\d{3}-\\d{7}|03\\d{9})$", message = "Invalid phone number format")
    private String phoneNumber;
}
