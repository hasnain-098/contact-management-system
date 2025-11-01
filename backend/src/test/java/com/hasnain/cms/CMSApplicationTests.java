package com.hasnain.cms;

import com.hasnain.cms.repository.ContactRepository;
import com.hasnain.cms.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

@SpringBootTest
class CMSApplicationTests {

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private ContactRepository contactRepository;

	@Test
	void contextLoads() {
	}

}
