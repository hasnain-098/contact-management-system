package com.hasnain.cms.mapper;

import com.hasnain.cms.dto.ContactDTO;
import com.hasnain.cms.dto.ContactEmailDTO;
import com.hasnain.cms.dto.ContactPhoneDTO;
import com.hasnain.cms.entity.Contact;
import com.hasnain.cms.entity.ContactEmail;
import com.hasnain.cms.entity.ContactPhone;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ContactMapperTest {

    @Test
    void constructor_shouldThrowException_whenInstantiated() throws Exception {
        Constructor<ContactMapper> constructor = ContactMapper.class.getDeclaredConstructor();
        constructor.setAccessible(true);
        assertThrows(InvocationTargetException.class, constructor::newInstance);
    }

    @Test
    void toDTO_shouldReturnNull_whenInputIsNull() {
        assertNull(ContactMapper.toDTO(null));
    }

    @Test
    void toEntity_shouldReturnNull_whenInputIsNull() {
        assertNull(ContactMapper.toEntity(null));
    }

    @Test
    void toDTO_shouldMapAllFields() {
        ContactEmail email = new ContactEmail();
        email.setId(1L);
        email.setLabel("Work");
        email.setEmail("user@company.com");

        ContactPhone phone = new ContactPhone();
        phone.setId(2L);
        phone.setLabel("Mobile");
        phone.setPhoneNumber("1234567890");

        Contact contact = new Contact();
        contact.setId(10L);
        contact.setFirstName("John");
        contact.setLastName("Doe");
        contact.setTitle("Manager");
        contact.setEmails(List.of(email));
        contact.setPhones(List.of(phone));

        ContactDTO dto = ContactMapper.toDTO(contact);

        assertNotNull(dto);
        assertEquals(10L, dto.getId());
        assertEquals("John", dto.getFirstName());
        assertEquals("Doe", dto.getLastName());
        assertEquals("Manager", dto.getTitle());
        assertEquals(1, dto.getEmails().size());
        assertEquals("user@company.com", dto.getEmails().get(0).getEmail());
        assertEquals("1234567890", dto.getPhones().get(0).getPhoneNumber());
    }

    @Test
    void toEntity_shouldMapAllFields() {
        ContactEmailDTO emailDTO = new ContactEmailDTO(1L, "Work", "john@doe.com");
        ContactPhoneDTO phoneDTO = new ContactPhoneDTO(2L, "Home", "9876543210");

        ContactDTO dto = new ContactDTO(
                5L,
                "Alice",
                "Smith",
                "Engineer",
                List.of(emailDTO),
                List.of(phoneDTO)
        );

        Contact entity = ContactMapper.toEntity(dto);

        assertNotNull(entity);
        assertEquals(5L, entity.getId());
        assertEquals("Alice", entity.getFirstName());
        assertEquals("Smith", entity.getLastName());
        assertEquals("Engineer", entity.getTitle());
        assertEquals(1, entity.getEmails().size());
        assertEquals("john@doe.com", entity.getEmails().get(0).getEmail());
        assertEquals("9876543210", entity.getPhones().get(0).getPhoneNumber());
    }

    @Test
    void toEmailEntity_shouldMapCorrectly() {
        ContactEmailDTO dto = new ContactEmailDTO(1L, "Work", "mail@demo.com");
        ContactEmail entity = ContactMapper.toEmailEntity(dto);

        assertNotNull(entity);
        assertEquals(1L, entity.getId());
        assertEquals("Work", entity.getLabel());
        assertEquals("mail@demo.com", entity.getEmail());
    }

    @Test
    void toPhoneEntity_shouldMapCorrectly() {
        ContactPhoneDTO dto = new ContactPhoneDTO(1L, "Mobile", "5550001234");
        ContactPhone entity = ContactMapper.toPhoneEntity(dto);

        assertNotNull(entity);
        assertEquals(1L, entity.getId());
        assertEquals("Mobile", entity.getLabel());
        assertEquals("5550001234", entity.getPhoneNumber());
    }

    @Test
    void helperMethods_shouldReturnNull_whenInputIsNull() {
        assertNull(ContactMapper.toEmailEntity(null));
        assertNull(ContactMapper.toPhoneEntity(null));
    }
}