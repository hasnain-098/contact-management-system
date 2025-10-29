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
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Slf4j
@Service
public class ContactService {

    @Autowired
    private ContactRepository contactRepository;

    @Autowired
    private UserService userService;
    
    public List<ContactDTO> getUserContacts(String identifier, String searchTerm, int page, int size) {

        log.debug("Fetching contacts for user '{}', Search: '{}' Page: {}, Size: {}.", identifier,
                searchTerm == null ? "N/A" : searchTerm, page, size);
        UserDetails userDetails = userService.loadUserByUsername(identifier);
        User user = ((SecurityUser) userDetails).getUser();

        Pageable pageable = PageRequest.of(page, size);
        Page<Contact> contactPage;

        if (StringUtils.hasText(searchTerm)) {
            log.debug("Performing search for term: '{}'", searchTerm);
            contactPage = contactRepository.findByUserAndFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
                    user, searchTerm, searchTerm, pageable);
        } else {
            log.debug("No search term provided, fetching all contacts for page.");
            contactPage = contactRepository.findByUser(user, pageable);
        }

        List<ContactDTO> contacts = contactPage.getContent()
                .stream()
                .map(ContactMapper::toDTO)
                .toList();

        log.info("Retrieved {} contacts for user '{}' (Page: {}, Search: '{}').", contacts.size(), identifier,
                page, searchTerm == null ? "N/A" : searchTerm);
        return contacts;
    }

    public ContactDTO createContact(String identifier, Contact contact) {

        log.info("User {} attempting to create contact: {} {}.", identifier, contact.getFirstName(),
                contact.getLastName());
        UserDetails userDetails = userService.loadUserByUsername(identifier);
        User user = ((SecurityUser) userDetails).getUser();

        if (contactRepository.existsByUserAndFirstNameAndLastName(user, contact.getFirstName(), contact.getLastName())) {
            log.warn("Creation failed: Duplicate contact name for user '{}': {} {}.", identifier,
                    contact.getFirstName(), contact.getLastName());
            throw new DuplicateContactException("Contact already exists with same name for this user");
        }

        contact.getEmails().forEach(email -> email.setContact(contact));
        contact.getPhones().forEach(phone -> phone.setContact(contact));
        contact.setUser(user);

        Contact savedContact = contactRepository.save(contact);
        log.info("Successfully created contact ID: {} for user: {}.", savedContact.getId(), identifier);
        return ContactMapper.toDTO(savedContact);
    }

    public ContactDTO getContactById(String identifier, Long id) {

        log.info("User '{}' attempting to view contact ID: {}.", identifier, id);
        UserDetails userDetails = userService.loadUserByUsername(identifier);
        User user = ((SecurityUser) userDetails).getUser();
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("View failed: Contact ID {} not found.", id);
                    return new ResourceNotFoundException("Contact not found");
                });
        if (!contact.getUser().getUserId().equals(user.getUserId())) {
            log.warn("View failed: User '{}' is unauthorized to access contact ID: {}.", identifier, id);
            throw new UnauthorizedAccessException("Unauthorized access to this contact");
        }

        log.info("User '{}' successfully viewed contact ID: {}.", identifier, id);
        return ContactMapper.toDTO(contact);
    }

    @Transactional
    public ContactDTO updateContact(String identifier, Long id, Contact contact) {

        log.info("User '{}' attempting to update contact ID: {}.", identifier, id);
        UserDetails userDetails = userService.loadUserByUsername(identifier);
        User user = ((SecurityUser) userDetails).getUser();
        Contact existingContact = contactRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Update failed: Contact ID {} not found.", id);
                    return new ResourceNotFoundException("Contact not found!");
                });
        if (!existingContact.getUser().getUserId().equals(user.getUserId())) {
            log.warn("Update failed: User '{}' is unauthorized to modify contact ID: {}.", identifier, id);
            throw new UnauthorizedAccessException("Unauthorized access to this contact");
        }

        if (!existingContact.getFirstName().equals(contact.getFirstName())
                || !existingContact.getLastName().equals(contact.getLastName())) {
            if (contactRepository.existsByUserAndFirstNameAndLastName(user, contact.getFirstName(),
                    contact.getLastName())) {
                log.warn("Update failed: New name '{} {}' is a duplicate for user '{}'.",
                        contact.getFirstName(), contact.getLastName(), identifier);
                throw new DuplicateContactException("A contact with this name already exists for your account.");
            }
        }

        existingContact.setFirstName(contact.getFirstName());
        existingContact.setLastName(contact.getLastName());
        existingContact.setTitle(contact.getTitle());

        existingContact.getEmails().clear();
        contact.getEmails().forEach(email -> {
            email.setContact(existingContact);
            existingContact.getEmails().add(email);
        });

        existingContact.getPhones().clear();
        contact.getPhones().forEach(phone -> {
            phone.setContact(existingContact);
            existingContact.getPhones().add(phone);
        });

        Contact updatedContact =  contactRepository.save(existingContact);

        log.info("Successfully updated contact ID: {} for user '{}'.", id, identifier);
        return ContactMapper.toDTO(updatedContact);
    }

    public boolean deleteContact(String identifier, Long id) {

        log.info("User '{}' attempting to delete contact ID: {}.", identifier, id);
        UserDetails userDetails = userService.loadUserByUsername(identifier);
        User user = ((SecurityUser) userDetails).getUser();
        Contact contact = contactRepository.findById(id)
                        .orElseThrow(() -> {
                            log.warn("Delete failed: Contact ID {} not found.", id);
                            return new ResourceNotFoundException("Contact not found.");
                        });
        if (!contact.getUser().getUserId().equals(user.getUserId())) {
            log.warn("Delete failed: User '{}' is unauthorized to delete contact ID: {}", identifier, id);
            throw new UnauthorizedAccessException("Unauthorized access to this contact.");
        }
        contactRepository.delete(contact);
        log.info("Successfully deleted contact ID: {} for user '{}'.", id, identifier);
        return true;
    }
}
