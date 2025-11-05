package com.hasnain.cms.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "contacts")
@Data
@NoArgsConstructor
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstName;

    private String lastName;

    private String title;

    @OneToMany(mappedBy = "contact", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    private List<ContactEmail> emails = new ArrayList<>();

    @OneToMany(mappedBy = "contact", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    private List<ContactPhone> phones = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    private User user;

    @PrePersist
    @PreUpdate
    void validateContactDetails() {

        boolean hasEmails = emails != null && !emails.isEmpty();
        boolean hasPhones = phones != null && !phones.isEmpty();

        if (!hasEmails && !hasPhones) {
            throw new IllegalStateException("A contact must have at least one email or one phone number.");
        }
    }

}
