package com.hasnain.contactsuite.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ContactDTO {

    private Long id;
    @NotBlank(message = "First name is required")
    private String firstName;

    private String lastName;

    @NotBlank(message = "Title is required")
    private String title;

    @NotEmpty(message = "At least one email is required")
    @Valid
    private List<ContactEmailDTO> emails;

    @NotEmpty(message = "At least one phone number is required")
    @Valid
    private List<ContactPhoneDTO> phones;
}
