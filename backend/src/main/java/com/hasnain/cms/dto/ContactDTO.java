package com.hasnain.cms.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
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

    private String title;

    @Valid
    private List<ContactEmailDTO> emails;

    @Valid
    private List<ContactPhoneDTO> phones;
}
