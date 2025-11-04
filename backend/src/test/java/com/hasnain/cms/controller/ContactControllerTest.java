package com.hasnain.cms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hasnain.cms.config.JwtService;
import com.hasnain.cms.dto.ContactDTO;
import com.hasnain.cms.dto.ContactEmailDTO;
import com.hasnain.cms.dto.ContactPhoneDTO;
import com.hasnain.cms.entity.Contact;
import com.hasnain.cms.exception.DuplicateContactException;
import com.hasnain.cms.exception.InvalidIdentifierFormatException;
import com.hasnain.cms.exception.ResourceNotFoundException;
import com.hasnain.cms.exception.UnauthorizedAccessException;
import com.hasnain.cms.service.ContactService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ContactController.class)
class ContactControllerTest {

    @TestConfiguration
    static class TestSecurityConfig {

        @Bean
        public SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
            http
                    .authorizeHttpRequests(auth -> auth.
                            anyRequest().authenticated())
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
    private ContactService contactService;

    @MockBean
    private JwtService jwtService;

    public static final String TEST_USER_EMAIL = "user@test.com";
    private ContactDTO contactDTO1;
    private ContactDTO contactDTO2;
    private ContactDTO contactDTONoId;
    private ContactEmailDTO emailDTO1;
    private ContactPhoneDTO phoneDTO1;

    @BeforeEach
    void setUp() {
        emailDTO1 = new ContactEmailDTO(1L, "work", "hasnain@example.com");
        phoneDTO1 = new ContactPhoneDTO(1L, "home", "03134567890");

        ContactEmailDTO emailDTO2 = new ContactEmailDTO(1L, "personal", "john@example.com");
        ContactPhoneDTO phoneDTO2 = new ContactPhoneDTO(1L, "work", "+92-314-0987654");

        contactDTO1 = new ContactDTO(1L, "Hasnain", "Memon", "Developer",
                List.of(emailDTO1), List.of(phoneDTO1));

        contactDTO2 = new ContactDTO(2L, "John", "Smith", "Manager",
                List.of(emailDTO2), List.of(phoneDTO2));

        contactDTONoId = new ContactDTO(null, "New", "Contact", "Analyst",
                List.of(new ContactEmailDTO(1L, "home", "new@example.com")),
                List.of(new ContactPhoneDTO(1L, "home", "03123456789")));
    }

    private String asJsonString(final Object object) {
        try {
            return objectMapper.writeValueAsString(object);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void getContacts_Success_NoSearch_Returns200AndContactList() throws Exception {

        List<ContactDTO> contacts = List.of(contactDTO1, contactDTO2);
        when(contactService.getUserContacts(eq(TEST_USER_EMAIL), isNull(), eq(0), eq(10)))
                .thenReturn(contacts);

        mockMvc.perform(get("/api/contacts")
                        .param("page", "0")
                        .param("size", "10")
                        .with(user(TEST_USER_EMAIL)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].firstName").value("Hasnain"))
                .andExpect(jsonPath("$[1].firstName").value("John"));
    }

    @Test
    void getContacts_Success_WithSearchTerm_ReturnsFilteredList() throws Exception {

        String searchTerm = "Has";
        List<ContactDTO> filteredContacts = List.of(contactDTO1);
        when(contactService.getUserContacts(eq(TEST_USER_EMAIL), eq(searchTerm), eq(0), eq(10)))
                .thenReturn(filteredContacts);

        mockMvc.perform(get("/api/contacts")
                        .param("search", searchTerm)
                        .param("page", "0")
                        .param("size", "10")
                        .with(user(TEST_USER_EMAIL)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].firstName").value("Hasnain"));
    }

    @Test
    void getContacts_Success_NoSearch_ReturnsEmptyList() throws Exception {

        when(contactService.getUserContacts(eq(TEST_USER_EMAIL), isNull(), eq(0), eq(10)))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/contacts")
                        .param("page", "0")
                        .param("size", "10")
                        .with(user(TEST_USER_EMAIL)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getContacts_Success_WithSearch_ReturnsEmptyList() throws Exception {

        String searchTerm = "NoMatch";
        when(contactService.getUserContacts(eq(TEST_USER_EMAIL), eq(searchTerm), eq(0), eq(10)))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/contacts")
                        .param("search", searchTerm)
                        .param("page", "0")
                        .param("size", "10")
                        .with(user(TEST_USER_EMAIL)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getContacts_InvalidIdentifierFormat_Returns400BadRequest() throws Exception {

        String errorMessage = "Invalid identifier. Must be a valid email or phone number.";
        when(contactService.getUserContacts(eq(TEST_USER_EMAIL), isNull(), eq(0), eq(10)))
                .thenThrow(new InvalidIdentifierFormatException(errorMessage));

        mockMvc.perform(get("/api/contacts")
                        .param("page", "0")
                        .param("size", "10")
                        .with(user(TEST_USER_EMAIL)))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value(errorMessage));
    }

    @Test
    void getContacts_UserNotFound_Returns404NotFound() throws Exception {

        String errorMessage = "User not found with identifier: " + TEST_USER_EMAIL;
        when(contactService.getUserContacts(eq(TEST_USER_EMAIL), isNull(), eq(0), eq(10)))
                .thenThrow(new ResourceNotFoundException(errorMessage));

        mockMvc.perform(get("/api/contacts")
                        .param("page", "0")
                        .param("size", "10")
                        .with(user(TEST_USER_EMAIL)))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value(errorMessage));
    }

    @Test
    void getContacts_ServiceFailure_Returns500InternalServerError() throws Exception {

        when(contactService.getUserContacts(eq(TEST_USER_EMAIL), isNull(), eq(0), eq(10)))
                .thenThrow(new RuntimeException("Database connection failed"));

        mockMvc.perform(get("/api/contacts")
                        .param("page", "0")
                        .param("size", "10")
                        .with(user(TEST_USER_EMAIL)))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void createContact_Success_Returns200AndContact() throws Exception {

        ContactDTO savedContact = new ContactDTO(3L, "New", "Contact", "Analyst",
                List.of(new ContactEmailDTO(1L, "home", "new@example.com")),
                List.of(new ContactPhoneDTO(1L, "home", "03123456789")));
        when(contactService.createContact(eq(TEST_USER_EMAIL), any(Contact.class))).thenReturn(savedContact);

        mockMvc.perform(post("/api/contacts")
                        .with(user(TEST_USER_EMAIL))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(contactDTONoId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3L))
                .andExpect(jsonPath("$.firstName").value("New"));
    }

    @Test
    void createContact_ValidationFailed_FirstNameBlank_Returns400BadRequest() throws Exception {

        ContactDTO invalidContact = new ContactDTO(null, null, "Test", "Title",
                List.of(emailDTO1), List.of(phoneDTO1));

        mockMvc.perform(post("/api/contacts")
                        .with(user(TEST_USER_EMAIL))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(invalidContact)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createContact_Failure_DuplicateContact_Returns409Conflict() throws Exception {

        String errorMessage = "Contact already exists with same name for this user";
        when(contactService.createContact(eq(TEST_USER_EMAIL), any(Contact.class)))
                .thenThrow(new DuplicateContactException(errorMessage));

        mockMvc.perform(post("/api/contacts")
                        .with(user(TEST_USER_EMAIL))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(contactDTONoId)))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value(errorMessage));
    }

    @Test
    void createContact_Failure_InvalidIdentifierFormat_Returns400BadRequest() throws Exception {

        String errorMessage = "Invalid identifier. Must be a valid email or phone number.";
        when(contactService.createContact(eq(TEST_USER_EMAIL), any(Contact.class)))
                .thenThrow(new InvalidIdentifierFormatException(errorMessage));

        mockMvc.perform(post("/api/contacts")
                        .with(user(TEST_USER_EMAIL))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(contactDTONoId)))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value(errorMessage));
    }

    @Test
    void createContact_Failure_UserNotFound_Returns404NotFound() throws Exception {

        String errorMessage = "User not found with identifier: " + TEST_USER_EMAIL;
        when(contactService.createContact(eq(TEST_USER_EMAIL), any(Contact.class)))
                .thenThrow(new ResourceNotFoundException(errorMessage));

        mockMvc.perform(post("/api/contacts")
                        .with(user(TEST_USER_EMAIL))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(contactDTONoId)))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value(errorMessage));
    }

    @Test
    void createContact_ServiceFailure_Returns500InternalServerError() throws Exception {

        when(contactService.createContact(eq(TEST_USER_EMAIL), any(Contact.class)))
                .thenThrow(new RuntimeException("Database save error"));

        mockMvc.perform(post("/api/contacts")
                        .with(user(TEST_USER_EMAIL))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(contactDTONoId)))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void getContact_Success_Returns200AndContact() throws Exception {

        when(contactService.getContactById(TEST_USER_EMAIL, 1L)).thenReturn(contactDTO1);

        mockMvc.perform(get("/api/contacts/1")
                        .with(user(TEST_USER_EMAIL)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.firstName").value("Hasnain"));
    }

    @Test
    void getContact_Failure_ContactNotFound_Returns404NotFound() throws Exception {

        String errorMessage = "Contact not found";
        when(contactService.getContactById(TEST_USER_EMAIL, 99L))
                .thenThrow(new ResourceNotFoundException(errorMessage));

        mockMvc.perform(get("/api/contacts/99")
                        .with(user(TEST_USER_EMAIL)))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value(errorMessage));
    }

    @Test
    void getContact_Failure_UnauthorizedAccess_Returns403Forbidden() throws Exception {

        String errorMessage = "Unauthorized access to this contact";
        when(contactService.getContactById(TEST_USER_EMAIL, 1L))
                .thenThrow(new UnauthorizedAccessException(errorMessage));

        mockMvc.perform(get("/api/contacts/1")
                        .with(user(TEST_USER_EMAIL)))
                .andExpect(status().isForbidden())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value(errorMessage));
    }

    @Test
    void getContact_Failure_InvalidIdentifierFormat_Returns400BadRequest() throws Exception {

        String errorMessage = "Invalid identifier. Must be a valid email or phone number.";
        when(contactService.getContactById(TEST_USER_EMAIL, 1L))
                .thenThrow(new InvalidIdentifierFormatException(errorMessage));

        mockMvc.perform(get("/api/contacts/1")
                        .with(user(TEST_USER_EMAIL)))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value(errorMessage));
    }

    @Test
    void getContact_Failure_UserNotFound_Returns404NotFound() throws Exception {

        String errorMessage = "User not found with identifier: " + TEST_USER_EMAIL;
        when(contactService.getContactById(TEST_USER_EMAIL, 1L))
                .thenThrow(new ResourceNotFoundException(errorMessage));

        mockMvc.perform(get("/api/contacts/1")
                        .with(user(TEST_USER_EMAIL)))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value(errorMessage));
    }

    @Test
    void getContact_ServiceFailure_Returns500() throws Exception {

        when(contactService.getContactById(TEST_USER_EMAIL, 1L))
                .thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/api/contacts/1")
                        .with(user(TEST_USER_EMAIL)))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void updateContact_Success_Returns200AndContact() throws Exception {

        ContactDTO updatedContact = new ContactDTO(1L, "Hasnain", "Memon", "Senior Developer",
                List.of(emailDTO1), List.of(phoneDTO1));
        when(contactService.updateContact(eq(TEST_USER_EMAIL), eq(1L), any(ContactDTO.class)))
                .thenReturn(updatedContact);

        mockMvc.perform(put("/api/contacts/1")
                        .with(user(TEST_USER_EMAIL))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(updatedContact)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.title").value("Senior Developer"));
    }

    @Test
    void updateContact_ValidationFailed_FirstNameBlank_Returns400BadRequest() throws Exception {

        ContactDTO invalidContact = new ContactDTO(1L, "", "Memon", "Title",
                List.of(emailDTO1), List.of(phoneDTO1));

        mockMvc.perform(put("/api/contacts/1")
                        .with(user(TEST_USER_EMAIL))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(invalidContact)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateContact_Failure_ContactNotFound_Returns404NotFound() throws Exception {

        String errorMessage = "Contact not found!";

        when(contactService.updateContact(eq(TEST_USER_EMAIL), eq(99L), any(ContactDTO.class)))
                .thenThrow(new ResourceNotFoundException(errorMessage));

        mockMvc.perform(put("/api/contacts/99")
                        .with(user(TEST_USER_EMAIL))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(contactDTO1)))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value(errorMessage));
    }

    @Test
    void updateContact_Failure_UnauthorizedAccess_Returns403Forbidden() throws Exception {

        String errorMessage = "Unauthorized access to this contact";

        when(contactService.updateContact(eq(TEST_USER_EMAIL), eq(1L), any(ContactDTO.class)))
                .thenThrow(new UnauthorizedAccessException(errorMessage));

        mockMvc.perform(put("/api/contacts/1")
                        .with(user(TEST_USER_EMAIL))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(contactDTO1)))
                .andExpect(status().isForbidden())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value(errorMessage));
    }

    @Test
    void updateContact_Failure_DuplicateContact_Returns409Conflict() throws Exception {

        String errorMessage = "A contact with this name already exists for your account.";

        when(contactService.updateContact(eq(TEST_USER_EMAIL), eq(1L), any(ContactDTO.class)))
                .thenThrow(new DuplicateContactException(errorMessage));

        mockMvc.perform(put("/api/contacts/1")
                        .with(user(TEST_USER_EMAIL))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(contactDTO1)))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value(errorMessage));
    }

    @Test
    void updateContact_Failure_InvalidIdentifierFormat_Returns400BadRequest() throws Exception {

        String errorMessage = "Invalid identifier. Must be a valid email or phone number.";

        when(contactService.updateContact(eq(TEST_USER_EMAIL), eq(1L), any(ContactDTO.class)))
                .thenThrow(new InvalidIdentifierFormatException(errorMessage));

        mockMvc.perform(put("/api/contacts/1")
                        .with(user(TEST_USER_EMAIL))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(contactDTO1)))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value(errorMessage));
    }

    @Test
    void updateContact_Failure_UserNotFound_Returns404NotFound() throws Exception {

        String errorMessage = "User not found with identifier: " + TEST_USER_EMAIL;

        when(contactService.updateContact(eq(TEST_USER_EMAIL), eq(1L), any(ContactDTO.class)))
                .thenThrow(new ResourceNotFoundException(errorMessage));

        mockMvc.perform(put("/api/contacts/1")
                        .with(user(TEST_USER_EMAIL))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(contactDTO1)))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value(errorMessage));
    }

    @Test
    void updateContact_ServiceFailed_Returns500InternalServerError() throws Exception {

        when(contactService.updateContact(eq(TEST_USER_EMAIL), eq(1L), any(ContactDTO.class)))
                .thenThrow(new RuntimeException("Database save error"));

        mockMvc.perform(put("/api/contacts/1")
                        .with(user(TEST_USER_EMAIL))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(asJsonString(contactDTO1)))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void deleteContact_Success_Returns200AndSuccessMessage() throws Exception {

        when(contactService.deleteContact(eq(TEST_USER_EMAIL), eq(1L)))
                .thenReturn(true);

        mockMvc.perform(delete("/api/contacts/1")
                        .with(user(TEST_USER_EMAIL)))
                .andExpect(status().isOk())
                .andExpect(content().string("Contact deleted successfully"));
    }

    @Test
    void deleteContact_Failure_ContactNotFound_Returns404NotFound() throws Exception {

        String errorMessage = "Contact not found.";

        when(contactService.deleteContact(eq(TEST_USER_EMAIL), eq(99L)))
                .thenThrow(new ResourceNotFoundException(errorMessage));

        mockMvc.perform(delete("/api/contacts/99")
                        .with(user(TEST_USER_EMAIL)))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value(errorMessage));
    }

    @Test
    void deleteContact_Failure_UnauthorizedAccess_Returns403Forbidden() throws Exception {

        String errorMessage = "Unauthorized access to this contact.";

        when(contactService.deleteContact(eq(TEST_USER_EMAIL), eq(1L)))
                .thenThrow(new UnauthorizedAccessException(errorMessage));

        mockMvc.perform(delete("/api/contacts/1")
                        .with(user(TEST_USER_EMAIL)))
                .andExpect(status().isForbidden())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value(errorMessage));
    }

    @Test
    void deleteContact_Failure_InvalidIdentifierFormat_Returns400BadRequest() throws Exception {

        String errorMessage = "Invalid identifier. Must be a valid email or phone number.";

        when(contactService.deleteContact(eq(TEST_USER_EMAIL), eq(1L)))
                .thenThrow(new InvalidIdentifierFormatException(errorMessage));

        mockMvc.perform(delete("/api/contacts/1")
                        .with(user(TEST_USER_EMAIL)))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value(errorMessage));
    }

    @Test
    void deleteContact_Failure_UserNotFound_Returns404NotFound() throws Exception {

        String errorMessage = "User not found with identifier: " + TEST_USER_EMAIL;

        when(contactService.deleteContact(eq(TEST_USER_EMAIL), eq(1L)))
                .thenThrow(new ResourceNotFoundException(errorMessage));

        mockMvc.perform(delete("/api/contacts/1")
                        .with(user(TEST_USER_EMAIL)))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value(errorMessage));
    }

    @Test
    void deleteContact_ServiceFailed_Returns500InternalServerError() throws Exception {

        when(contactService.deleteContact(eq(TEST_USER_EMAIL), eq(1L)))
                .thenThrow(new RuntimeException("Database delete error"));

        mockMvc.perform(delete("/api/contacts/1")
                        .with(user(TEST_USER_EMAIL)))
                .andExpect(status().isInternalServerError());
    }
}
