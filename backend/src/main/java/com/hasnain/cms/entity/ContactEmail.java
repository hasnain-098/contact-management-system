package com.hasnain.cms.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "contact_emails")
@Data
@NoArgsConstructor
public class ContactEmail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String label;

    @Column(nullable = false)
    private String email;

    @ManyToOne
    @JoinColumn(name = "contact_id")
    private Contact contact;
}
