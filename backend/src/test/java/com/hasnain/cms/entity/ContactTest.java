package com.hasnain.cms.entity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ContactTest {

    private Contact contact;

    @BeforeEach
    void setUp() {
        contact = new Contact();
        contact.setId(1L);
        contact.setFirstName("John");
        contact.setLastName("Doe");
        contact.setTitle("Manager");

        ContactEmail email = new ContactEmail();
        email.setId(10L);
        email.setLabel("Work");
        email.setEmail("john@example.com");
        email.setContact(contact);

        ContactPhone phone = new ContactPhone();
        phone.setId(20L);
        phone.setLabel("Mobile");
        phone.setPhoneNumber("1234567890");
        phone.setContact(contact);

        User user = new User();
        user.setUserId(100L);
        user.setEmail("user@test.com");
        user.setPhone("9876543210");

        contact.setUser(user);
        contact.setEmails(List.of(email));
        contact.setPhones(List.of(phone));
    }

    @Test
    void validateContactDetails_shouldPassWithEmailsOrPhones() {
        assertDoesNotThrow(() -> contact.validateContactDetails());
    }

    @Test
    void validateContactDetails_shouldThrowWhenNoEmailOrPhone() {
        contact.setEmails(List.of());
        contact.setPhones(List.of());

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> contact.validateContactDetails()
        );

        assertEquals("A contact must have at least one email or one phone number.", ex.getMessage());
    }

    @Test
    void validateContactDetails_shouldPassWithOnlyEmail() {
        contact.setPhones(List.of());
        assertDoesNotThrow(() -> contact.validateContactDetails());
    }

    @Test
    void validateContactDetails_shouldPassWithOnlyPhone() {
        contact.setEmails(List.of());
        assertDoesNotThrow(() -> contact.validateContactDetails());
    }
}