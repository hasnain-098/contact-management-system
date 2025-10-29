package com.hasnain.contactsuite.mapper;

import com.hasnain.contactsuite.dto.ContactDTO;
import com.hasnain.contactsuite.dto.ContactEmailDTO;
import com.hasnain.contactsuite.dto.ContactPhoneDTO;
import com.hasnain.contactsuite.entity.Contact;
import com.hasnain.contactsuite.entity.ContactEmail;
import com.hasnain.contactsuite.entity.ContactPhone;

import java.util.stream.Collectors;

public class ContactMapper {

    public static ContactDTO toDTO(Contact contact) {

        if (contact == null) {
            return null;
        }

        return new ContactDTO(
                contact.getId(),
                contact.getFirstName(),
                contact.getLastName(),
                contact.getTitle(),
                contact.getEmails().stream()
                        .map(email -> new ContactEmailDTO(email.getId(), email.getLabel(), email.getEmail()))
                                .collect(Collectors.toList()),
                contact.getPhones().stream()
                        .map(phone -> new ContactPhoneDTO(phone.getId(), phone.getLabel(), phone.getPhoneNumber()))
                        .collect(Collectors.toList())
        );
    }

    public static Contact toEntity(ContactDTO contactDTO) {

        if (contactDTO == null) {
            return null;
        }

        Contact contact = new Contact();
        contact.setId(contactDTO.getId());
        contact.setFirstName(contactDTO.getFirstName());
        contact.setLastName(contactDTO.getLastName());
        contact.setTitle(contactDTO.getTitle());

        contact.setEmails(contactDTO.getEmails().stream()
                .map(emailDTO -> {
                    ContactEmail email = new ContactEmail();
                    email.setId(emailDTO.getId());
                    email.setLabel(emailDTO.getLabel());
                    email.setEmail(emailDTO.getEmail());
                    email.setContact(contact);
                    return email;
                })
                .collect(Collectors.toList()));

        contact.setPhones(contactDTO.getPhones().stream()
                .map(phoneDTO -> {
                    ContactPhone phone = new ContactPhone();
                    phone.setId(phoneDTO.getId());
                    phone.setLabel(phoneDTO.getLabel());
                    phone.setPhoneNumber(phoneDTO.getPhoneNumber());
                    phone.setContact(contact);
                    return phone;
                })
                .collect(Collectors.toList()));

        return contact;
    }
}
