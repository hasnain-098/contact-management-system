package com.hasnain.contactsuite;

import com.hasnain.contactsuite.repository.ContactRepository;
import com.hasnain.contactsuite.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

@SpringBootTest
class ContactSuiteApplicationTests {

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private ContactRepository contactRepository;

	@Test
	void contextLoads() {
	}

}
