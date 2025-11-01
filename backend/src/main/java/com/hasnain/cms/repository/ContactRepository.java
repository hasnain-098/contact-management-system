package com.hasnain.cms.repository;

import com.hasnain.cms.entity.Contact;
import com.hasnain.cms.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContactRepository extends JpaRepository<Contact, Long> {

    Page<Contact> findByUser(User user, Pageable pageable);
    boolean existsByUserAndFirstNameAndLastName(User user, String firstName, String lastName);
    Page<Contact> findByUserAndFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
            User user, String firstNameSearchTerm, String lastNameSearchTerm2, Pageable pageable);
}
