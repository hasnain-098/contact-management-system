package com.hasnain.contactsuite.repository;

import com.hasnain.contactsuite.entity.Contact;
import com.hasnain.contactsuite.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContactRepository extends JpaRepository<Contact, Long> {

    Page<Contact> findByUser(User user, Pageable pageable);
    boolean existsByUserAndFirstNameAndLastName(User user, String firstName, String lastName);
    Page<Contact> findByUserAndFirstNameContainingIgnoreCaseOrUserAndLastNameContainingIgnoreCase(
            User user, String searchTerm, String searchTerm2, Pageable pageable);
}
