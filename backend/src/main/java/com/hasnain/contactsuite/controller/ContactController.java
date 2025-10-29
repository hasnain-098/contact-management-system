package com.hasnain.contactsuite.controller;

import com.hasnain.contactsuite.dto.ContactDTO;
import com.hasnain.contactsuite.mapper.ContactMapper;
import com.hasnain.contactsuite.service.ContactService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/contacts")
public class ContactController {

    @Autowired
    private ContactService contactService;

    @GetMapping
    public ResponseEntity<List<ContactDTO>> getContacts(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
            ) {
        String username = userDetails.getUsername();
        log.info("User '{}' requesting contacts list. Search: '{}' Page: {}, Size: {}", username,
                search == null ? "N/A" : search, page, size);

        List<ContactDTO> contacts = contactService.getUserContacts(username, search, page, size);

        log.info("User '{}' successfully retrieved {} contacts (Page: {}, Search: '{}').", username,
               contacts.size(), page, search == null ? "N/A" : search);
        return ResponseEntity.ok(contacts);
    }

    @PostMapping
    public  ResponseEntity<ContactDTO> createContact(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ContactDTO contactDTO) {

        String username = userDetails.getUsername();
        log.info("User '{}' initiating contact creation.", username);

        ContactDTO savedContact = contactService.createContact(username, ContactMapper.toEntity(contactDTO));

        log.info("User '{}' successfully created new contact with ID: {}", username, savedContact.getId());
        return ResponseEntity.ok(savedContact);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContactDTO> getContact(@AuthenticationPrincipal UserDetails userDetails,
                                              @PathVariable Long id) {

        String username = userDetails.getUsername();
        log.info("User '{}' requesting details for contact ID: {}", username, id);

        ContactDTO contact = contactService.getContactById(username, id);

        log.info("User '{}' successfully retrieved contact ID: {}", username, id);
        return ResponseEntity.ok(contact);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContactDTO> updateContact(@AuthenticationPrincipal UserDetails userDetails,
                                                 @PathVariable Long id,
                                                 @Valid @RequestBody ContactDTO contactDTO) {

        String username = userDetails.getUsername();
        log.info("User '{}' initiating update for contact ID: {}", username, id);

        ContactDTO updatedContact = contactService.updateContact(username, id,
                ContactMapper.toEntity(contactDTO));

        log.info("User '{}' successfully updated contact ID: {}", username, id);
        return ResponseEntity.ok(updatedContact);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteContact(@AuthenticationPrincipal UserDetails userDetails,
                                                 @PathVariable Long id) {

        String username = userDetails.getUsername();
        log.info("User '{}' attempting to delete contact ID: {}", username, id);

        boolean success = contactService.deleteContact(userDetails.getUsername(), id);
        if (success) {
            log.info("User '{}' successfully deleted contact ID: {}", username, id);
            return ResponseEntity.ok("Contact deleted successfully");
        } else {
            log.warn("User '{}' failed to delete contact ID: {}. Contact may not exist or belongs to another user",
                    username, id);
            return ResponseEntity.ok("Unable to delete contact");
        }
    }
}