package com.hasnain.contactsuite.service;

import com.hasnain.contactsuite.dto.ContactDTO;
import com.hasnain.contactsuite.entity.Contact;
import com.hasnain.contactsuite.entity.User;
import com.hasnain.contactsuite.exception.DuplicateContactException;
import com.hasnain.contactsuite.exception.ResourceNotFoundException;
import com.hasnain.contactsuite.exception.UnauthorizedAccessException;
import com.hasnain.contactsuite.mapper.ContactMapper;
import com.hasnain.contactsuite.repository.ContactRepository;
import com.hasnain.contactsuite.security.SecurityUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ContactServiceTest {

    @Mock
    private ContactRepository contactRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private ContactService contactService;

    private MockedStatic<ContactMapper> contactMapperMockedStatic;

    private final String TEST_EMAIL = "user@test.com";
    private final String TEST_PHONE = "+92-312-5467890";
    private final String INVALID_IDENTIFIER = "invalid_identifier";

    private User testUserEmail;
    private User testUserPhone;
    private SecurityUser testSecurityUserEmail;
    private SecurityUser testSecurityUserPhone;
    private Contact testContact;
    private Contact testContact2;
    private ContactDTO testContactDTO;
    private ContactDTO testContactDTO2;
    private Contact contactToSave;
    private Contact savedContact;
    private ContactDTO savedContactDTO;
    private Contact existingContact;
    private Contact contactToUpdate;
    private ContactDTO updatedContactDTO;

    @BeforeEach
    void setUp() {

        testUserEmail = new User();
        testUserEmail.setUserId(1L);
        testUserEmail.setEmail(TEST_EMAIL);

        testUserPhone = new User();
        testUserPhone.setUserId(2L);
        testUserPhone.setPhone(TEST_PHONE);

        testSecurityUserEmail = new SecurityUser(testUserEmail);
        testSecurityUserPhone = new SecurityUser(testUserPhone);

        testContact = new Contact();
        testContact.setId(1L);
        testContact.setFirstName("Test");
        testContact.setLastName("Contact");
        testContact.setUser(testUserEmail);

        testContact2 = new Contact();
        testContact2.setId(2L);
        testContact2.setFirstName("Another");
        testContact2.setLastName("Entry");
        testContact2.setUser(testUserEmail);

        testContactDTO = new ContactDTO(testContact.getId(), testContact.getFirstName(), testContact.getLastName(),
                testContact.getTitle(), Collections.emptyList(), Collections.emptyList());
        testContactDTO2 = new ContactDTO(testContact2.getId(), testContact2.getFirstName(), testContact2.getLastName(),
                testContact2.getTitle(), Collections.emptyList(), Collections.emptyList());

        contactToSave = new Contact();
        contactToSave.setFirstName("New");
        contactToSave.setLastName("Contact");
        contactToSave.setTitle("Title");
        contactToSave.setEmails(new ArrayList<>());
        contactToSave.setPhones(new ArrayList<>());

        savedContact = new Contact();
        savedContact.setId(10L);
        savedContact.setFirstName("New");
        savedContact.setLastName("Contact");
        savedContact.setTitle("Title");

        savedContactDTO = new ContactDTO(savedContact.getId(), savedContact.getFirstName(), savedContact.getLastName(),
                savedContact.getTitle(), Collections.emptyList(), Collections.emptyList());

        existingContact = new Contact();
        existingContact.setId(1L);
        existingContact.setUser(testUserEmail);
        existingContact.setFirstName("Old");
        existingContact.setLastName("Name");
        existingContact.setTitle("Old Title");
        existingContact.setEmails(new ArrayList<>());
        existingContact.setPhones(new ArrayList<>());

        contactToUpdate = new Contact();
        contactToUpdate.setFirstName("New");
        contactToUpdate.setLastName("Name");
        contactToUpdate.setTitle("New Title");
        contactToUpdate.setEmails(new ArrayList<>());
        contactToUpdate.setPhones(new ArrayList<>());

        updatedContactDTO = new ContactDTO(existingContact.getId(), contactToUpdate.getFirstName(),
                contactToUpdate.getLastName(), contactToUpdate.getTitle(), Collections.emptyList(),
                Collections.emptyList());

        contactMapperMockedStatic = mockStatic(ContactMapper.class);
    }

    @AfterEach
    void tearDown() {
        contactMapperMockedStatic.close();
    }

    @Test
    void getUserContacts_Success_WithEmail_NoSearch() {

        Page<Contact> contactPage = new PageImpl<>(List.of(testContact, testContact2));
        Pageable pageable = PageRequest.of(0, 10);

        when(userService.loadUserByUsername(TEST_EMAIL)).thenReturn(testSecurityUserEmail);
        when(contactRepository.findByUser(testUserEmail, pageable)).thenReturn(contactPage);
        contactMapperMockedStatic.when(() -> ContactMapper.toDTO(testContact)).thenReturn(testContactDTO);
        contactMapperMockedStatic.when(() -> ContactMapper.toDTO(testContact2)).thenReturn(testContactDTO2);

        List<ContactDTO> result = contactService.getUserContacts(TEST_EMAIL, null, 0, 10);

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Test", result.get(0).getFirstName());
        assertEquals("Another", result.get(1).getFirstName());

        verify(contactRepository).findByUser(testUserEmail, pageable);
        verify(contactRepository, never()).findByUserAndFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
                any(), any(), any(), any());
    }

    @Test
    void getUserContacts_Success_WithPhone_NoSearch() {

        Page<Contact> contactPage = new PageImpl<>(List.of(testContact));
        Pageable pageable = PageRequest.of(0, 10);

        testContact.setUser(testUserPhone);
        testContactDTO = new ContactDTO(testContact.getId(), testContact.getFirstName(), testContact.getLastName(),
                testContact.getTitle(), Collections.emptyList(), Collections.emptyList());

        when(userService.loadUserByUsername(TEST_PHONE)).thenReturn(testSecurityUserPhone);
        when(contactRepository.findByUser(testUserPhone, pageable)).thenReturn(contactPage);
        contactMapperMockedStatic.when(() -> ContactMapper.toDTO(testContact)).thenReturn(testContactDTO);

        List<ContactDTO> result = contactService.getUserContacts(TEST_PHONE, null, 0, 10);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Test", result.get(0).getFirstName());

        verify(contactRepository).findByUser(testUserPhone, pageable);
        verify(contactRepository, never()).findByUserAndFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
                any(), any(), any(), any());
    }

    @Test
    void getUserContacts_Success_WithSearchTerm_ReturnsFilteredList() {

        String searchTerm = "Test";
        Page<Contact> filteredPage = new PageImpl<>(List.of(testContact));
        Pageable pageable = PageRequest.of(0, 10);

        when(userService.loadUserByUsername(TEST_EMAIL)).thenReturn(testSecurityUserEmail);
        when(contactRepository.findByUserAndFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
                testUserEmail, searchTerm, searchTerm, pageable)).thenReturn(filteredPage);
        contactMapperMockedStatic.when(() -> ContactMapper.toDTO(testContact)).thenReturn(testContactDTO);

        List<ContactDTO> result = contactService.getUserContacts(TEST_EMAIL, searchTerm, 0, 10);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Test", result.get(0).getFirstName());

        verify(contactRepository).findByUserAndFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
                testUserEmail, searchTerm, searchTerm, pageable);
        verify(contactRepository, never()).findByUser(any(), any());
    }

    @Test
    void getUserContacts_Success_NoSearch_ReturnsEmptyList() {

        Page<Contact> emptyPage = new PageImpl<>(Collections.emptyList());
        Pageable pageable = PageRequest.of(0, 10);

        when(userService.loadUserByUsername(TEST_EMAIL)).thenReturn(testSecurityUserEmail);
        when(contactRepository.findByUser(testUserEmail, pageable)).thenReturn(emptyPage);

        List<ContactDTO> result = contactService.getUserContacts(TEST_EMAIL, null, 0, 10);

        assertNotNull(result);
        assertTrue(result.isEmpty());

        verify(contactRepository).findByUser(testUserEmail, pageable);
        verify(contactRepository, never()).findByUserAndFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
                any(), any(), any(), any());
    }

    @Test
    void getUserContacts_Success_WithSearchTerm_ReturnsEmptyList() {

        String searchTerm = "NoMatch";
        Page<Contact> emptyPage = new PageImpl<>(Collections.emptyList());
        Pageable pageable = PageRequest.of(0, 10);

        when(userService.loadUserByUsername(TEST_EMAIL)).thenReturn(testSecurityUserEmail);
        when(contactRepository.findByUserAndFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
                testUserEmail, searchTerm, searchTerm, pageable)).thenReturn(emptyPage);

        List<ContactDTO> result = contactService.getUserContacts(TEST_EMAIL, searchTerm, 0, 10);

        assertNotNull(result);
        assertTrue(result.isEmpty());

        verify(contactRepository).findByUserAndFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
                testUserEmail, searchTerm, searchTerm, pageable);
        verify(contactRepository, never()).findByUser(any(), any());
    }

    @Test
    void getUserContacts_Failure_InvalidIdentifierFormat() {

        String expectedError = "Invalid identifier. Must be a valid email or phone number.";
        when(userService.loadUserByUsername(INVALID_IDENTIFIER))
                .thenThrow(new UsernameNotFoundException(expectedError));

        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> contactService.getUserContacts(INVALID_IDENTIFIER, null, 0, 10)
        );

        assertEquals(expectedError, exception.getMessage());
    }

    @Test
    void getUserContacts_Failure_UserNotFoundWithEmail() {

        String expectedError = "User not found with identifier: " + TEST_EMAIL;
        when(userService.loadUserByUsername(TEST_EMAIL))
                .thenThrow(new UsernameNotFoundException(expectedError));

        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> contactService.getUserContacts(TEST_EMAIL, null, 0, 10)
        );

        assertEquals(expectedError, exception.getMessage());
    }

    @Test
    void getUserContacts_Failure_UserNotFoundWithPhone() {

        String expectedError = "User not found with identifier: " + TEST_PHONE;
        when(userService.loadUserByUsername(TEST_PHONE))
                .thenThrow(new UsernameNotFoundException(expectedError));

        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> contactService.getUserContacts(TEST_PHONE, null, 0, 10)
        );

        assertEquals(expectedError, exception.getMessage());
    }

    @Test
    void findUserByIdentifier_Failure_InvalidUserDetailsType() {

        UserDetails mockUserDetails = mock(UserDetails.class);
        when(userService.loadUserByUsername(TEST_EMAIL)).thenReturn(mockUserDetails);

        assertThrows(
                ClassCastException.class,
                () -> contactService.getUserContacts(TEST_EMAIL, null, 0, 10)
        );
    }

    @Test
    void createContact_Success_WithEmail() {

        when(userService.loadUserByUsername(TEST_EMAIL)).thenReturn(testSecurityUserEmail);
        when(contactRepository.existsByUserAndFirstNameAndLastName(testUserEmail,
                contactToSave.getFirstName(), contactToSave.getLastName())).thenReturn(false);

        contactToSave.setUser(testUserEmail);
        when(contactRepository.save(any(Contact.class))).thenReturn(savedContact);

        contactMapperMockedStatic.when(() -> ContactMapper.toDTO(savedContact)).thenReturn(savedContactDTO);

        ContactDTO result = contactService.createContact(TEST_EMAIL, contactToSave);

        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals("New", result.getFirstName());
    }

    @Test
    void createContact_Success_withPhone() {

        when(userService.loadUserByUsername(TEST_PHONE)).thenReturn(testSecurityUserPhone);
        when(contactRepository.existsByUserAndFirstNameAndLastName(testUserPhone,
                contactToSave.getFirstName(), contactToSave.getLastName())).thenReturn(false);

        contactToSave.setUser(testUserPhone);
        when(contactRepository.save(any(Contact.class))).thenReturn(savedContact);

        contactMapperMockedStatic.when(() -> ContactMapper.toDTO(savedContact)).thenReturn(savedContactDTO);

        ContactDTO result = contactService.createContact(TEST_PHONE, contactToSave);

        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals("New", result.getFirstName());
    }

    @Test
    void createContact_Failure_InvalidIdentifierFormat() {

        String expectedError = "Invalid identifier. Must be a valid email or phone number.";
        when(userService.loadUserByUsername(INVALID_IDENTIFIER))
                .thenThrow(new UsernameNotFoundException(expectedError));

        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> contactService.createContact(INVALID_IDENTIFIER, contactToSave)
        );

        assertEquals(expectedError, exception.getMessage());
    }

    @Test
    void createContact_Failure_UserNotFoundWithEmail() {

        String expectedError = "User not found with identifier: " + TEST_EMAIL;
        when(userService.loadUserByUsername(TEST_EMAIL))
                .thenThrow(new UsernameNotFoundException(expectedError));

        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> contactService.createContact(TEST_EMAIL, contactToSave)
        );

        assertEquals(expectedError, exception.getMessage());
    }

    @Test
    void createContact_Failure_UserNotFoundWithPhone() {

        String expectedError = "User not found with identifier: " + TEST_PHONE;
        when(userService.loadUserByUsername(TEST_PHONE))
                .thenThrow(new UsernameNotFoundException(expectedError));

        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> contactService.createContact(TEST_PHONE, contactToSave)
        );

        assertEquals(expectedError, exception.getMessage());
    }

    @Test
    void createContact_Failure_DuplicateContact() {

        String expectedError = "Contact already exists with same name for this user";

        when(userService.loadUserByUsername(TEST_EMAIL)).thenReturn(testSecurityUserEmail);

        when(contactRepository.existsByUserAndFirstNameAndLastName(testUserEmail,
                "New", "Contact")).thenReturn(true);

        DuplicateContactException exception = assertThrows(
                DuplicateContactException.class,
                () -> contactService.createContact(TEST_EMAIL, contactToSave)
        );
        assertEquals(expectedError, exception.getMessage());
    }

    @Test
    void getContactById_Success() {

        when(userService.loadUserByUsername(TEST_EMAIL)).thenReturn(testSecurityUserEmail);

        testContact.setUser(testUserEmail);
        when(contactRepository.findById(1L)).thenReturn(Optional.of(testContact));

        contactMapperMockedStatic.when(() -> ContactMapper.toDTO(testContact)).thenReturn(testContactDTO);

        ContactDTO result = contactService.getContactById(TEST_EMAIL, 1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(testContact.getFirstName(), result.getFirstName());
    }

    @Test
    void getContactById_Failure_InvalidIdentifierFormat() {

        String expectedError = "Invalid identifier. Must be a valid email or phone number.";
        when(userService.loadUserByUsername(INVALID_IDENTIFIER))
                .thenThrow(new UsernameNotFoundException(expectedError));

        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> contactService.getContactById(INVALID_IDENTIFIER, 1L)
        );

        assertEquals(expectedError, exception.getMessage());
    }

    @Test
    void getContactById_Failure_UserNotFound() {

        String expectedError = "User not found with identifier: " + TEST_EMAIL;
        when(userService.loadUserByUsername(TEST_EMAIL))
                .thenThrow(new UsernameNotFoundException(expectedError));

        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> contactService.getContactById(TEST_EMAIL, 1L)
        );

        assertEquals(expectedError, exception.getMessage());
    }

    @Test
    void getContactById_Failure_ContactNotFound() {

        String expectedError = "Contact not found";

        when(userService.loadUserByUsername(TEST_EMAIL)).thenReturn(testSecurityUserEmail);
        when(contactRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> contactService.getContactById(TEST_EMAIL, 99L)
        );

        assertEquals(expectedError, exception.getMessage());
    }

    @Test
    void getContactById_Failure_UnauthorizedAccess() {

        String expectedError = "Unauthorized access to this contact";

        when(userService.loadUserByUsername(TEST_EMAIL)).thenReturn(testSecurityUserEmail);

        testContact.setUser(testUserPhone);
        when(contactRepository.findById(1L)).thenReturn(Optional.of(testContact));

        UnauthorizedAccessException exception = assertThrows(
                UnauthorizedAccessException.class,
                () -> contactService.getContactById(TEST_EMAIL, 1L)
        );

        assertEquals(expectedError, exception.getMessage());
    }

    @Test
    void updateContact_Success_NameChange() {

        when(userService.loadUserByUsername(TEST_EMAIL)).thenReturn(testSecurityUserEmail);

        when(contactRepository.findById(1L)).thenReturn(Optional.of(existingContact));

        when(contactRepository.existsByUserAndFirstNameAndLastName(testUserEmail,
                contactToUpdate.getFirstName(), contactToUpdate.getLastName())).thenReturn(false);

        when(contactRepository.save(any(Contact.class))).thenReturn(existingContact);

        contactMapperMockedStatic.when(() -> ContactMapper.toDTO(existingContact)).thenReturn(updatedContactDTO);

        ContactDTO result = contactService.updateContact(TEST_EMAIL, 1L, contactToUpdate);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(contactToUpdate.getFirstName(), result.getFirstName());
        assertEquals(contactToUpdate.getTitle(), result.getTitle());
    }

    @Test
    void updateContact_Success_NoNameChange() {

        contactToUpdate.setFirstName("Old");

        when(userService.loadUserByUsername(TEST_EMAIL)).thenReturn(testSecurityUserEmail);

        when(contactRepository.findById(1L)).thenReturn(Optional.of(existingContact));

        when(contactRepository.save(any(Contact.class))).thenReturn(existingContact);

        updatedContactDTO.setFirstName(contactToUpdate.getFirstName());
        contactMapperMockedStatic.when(() -> ContactMapper.toDTO(existingContact)).thenReturn(updatedContactDTO);

        ContactDTO result = contactService.updateContact(TEST_EMAIL, 1L, contactToUpdate);

        assertNotNull(result);
        assertEquals(contactToUpdate.getFirstName(), result.getFirstName());
        assertEquals(contactToUpdate.getTitle(), result.getTitle());

        verify(contactRepository, never()).existsByUserAndFirstNameAndLastName(any(), any(), any());
    }

    @Test
    void updateContact_Failure_InvalidIdentifierFormat() {

        String expectedError = "Invalid identifier. Must be a valid email or phone number.";
        when(userService.loadUserByUsername(INVALID_IDENTIFIER))
                .thenThrow(new UsernameNotFoundException(expectedError));

        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> contactService.updateContact(INVALID_IDENTIFIER, 1L, contactToUpdate)
        );

        assertEquals(expectedError, exception.getMessage());
    }

    @Test
    void updateContact_Failure_UserNotFound() {

        String expectedError = "User not found with identifier: " + TEST_EMAIL;
        when(userService.loadUserByUsername(TEST_EMAIL))
                .thenThrow(new UsernameNotFoundException(expectedError));

        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> contactService.updateContact(TEST_EMAIL, 1L, contactToUpdate)
        );

        assertEquals(expectedError, exception.getMessage());
    }

    @Test
    void updateContact_Failure_ContactNotFound() {

        String expectedError = "Contact not found!";

        when(userService.loadUserByUsername(TEST_EMAIL)).thenReturn(testSecurityUserEmail);
        when(contactRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> contactService.updateContact(TEST_EMAIL, 99L, contactToUpdate)
        );

        assertEquals(expectedError, exception.getMessage());
    }

    @Test
    void updateContact_Failure_UnauthorizedAccess() {

        String expectedError = "Unauthorized access to this contact";

        when(userService.loadUserByUsername(TEST_EMAIL)).thenReturn(testSecurityUserEmail);
        when(contactRepository.findById(1L)).thenReturn(Optional.of(existingContact));

        existingContact.setUser(testUserPhone);
        when(contactRepository.findById(1L)).thenReturn(Optional.of(existingContact));

        UnauthorizedAccessException exception = assertThrows(
                UnauthorizedAccessException.class,
                () -> contactService.updateContact(TEST_EMAIL, 1L, contactToUpdate)
        );

        assertEquals(expectedError, exception.getMessage());
    }

    @Test
    void updateContact_Failure_DuplicateContact() {

        String expectedError = "A contact with this name already exists for your account.";

        when(userService.loadUserByUsername(TEST_EMAIL)).thenReturn(testSecurityUserEmail);
        when(contactRepository.findById(1L)).thenReturn(Optional.of(existingContact));
        when(contactRepository.existsByUserAndFirstNameAndLastName(testUserEmail,
                contactToUpdate.getFirstName(), contactToUpdate.getLastName())).thenReturn(true);

        DuplicateContactException exception = assertThrows(
                DuplicateContactException.class,
                () -> contactService.updateContact(TEST_EMAIL, 1L, contactToUpdate)
        );

        assertEquals(expectedError, exception.getMessage());
    }

    @Test
    void deleteContact_Success() {

        when(userService.loadUserByUsername(TEST_EMAIL)).thenReturn(testSecurityUserEmail);
        when(contactRepository.findById(1L)).thenReturn(Optional.of(existingContact));

        doNothing().when(contactRepository).delete(existingContact);

        boolean result = contactService.deleteContact(TEST_EMAIL, 1L);

        assertTrue(result);
        verify(contactRepository).delete(existingContact);
    }

    @Test
    void deleteContact_Failure_InvalidIdentifierFormat() {

        String expectedError = "Invalid identifier. Must be a valid email or phone number.";
        when(userService.loadUserByUsername(INVALID_IDENTIFIER))
                .thenThrow(new UsernameNotFoundException(expectedError));

        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> contactService.deleteContact(INVALID_IDENTIFIER, 1L)
        );

        assertEquals(expectedError, exception.getMessage());
    }

    @Test
    void deleteContact_Failure_UserNotFound() {

        String expectedError = "User not found with identifier: " + TEST_EMAIL;
        when(userService.loadUserByUsername(TEST_EMAIL))
                .thenThrow(new UsernameNotFoundException(expectedError));

        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> contactService.deleteContact(TEST_EMAIL, 1L)
        );

        assertEquals(expectedError, exception.getMessage());
    }

    @Test
    void deleteContact_Failure_ContactNotFound() {

        String expectedError = "Contact not found.";

        when(userService.loadUserByUsername(TEST_EMAIL)).thenReturn(testSecurityUserEmail);
        when(contactRepository.findById(99L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> contactService.deleteContact(TEST_EMAIL, 99L)
        );

        assertEquals(expectedError, exception.getMessage());
    }

    @Test
    void deleteContact_Failure_UnauthorizedAccess() {

        String expectedError = "Unauthorized access to this contact.";

        when(userService.loadUserByUsername(TEST_EMAIL)).thenReturn(testSecurityUserEmail);
        existingContact.setUser(testUserPhone);
        when(contactRepository.findById(1L)).thenReturn(Optional.of(existingContact));

        UnauthorizedAccessException exception = assertThrows(
                UnauthorizedAccessException.class,
                () -> contactService.deleteContact(TEST_EMAIL, 1L)
        );

        assertEquals(expectedError, exception.getMessage());
    }
}
