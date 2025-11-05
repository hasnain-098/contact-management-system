package com.hasnain.cms.mapper;

import com.hasnain.cms.dto.UserDTO;
import com.hasnain.cms.entity.User;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;

import static org.junit.jupiter.api.Assertions.*;

class UserMapperTest {

    @Test
    void constructor_shouldThrowException_whenInstantiated() throws Exception {
        Constructor<UserMapper> constructor = UserMapper.class.getDeclaredConstructor();
        constructor.setAccessible(true);
        assertThrows(InvocationTargetException.class, constructor::newInstance);
    }

    @Test
    void toDTO_shouldReturnNull_whenInputIsNull() {
        assertNull(UserMapper.toDTO(null));
    }

    @Test
    void toEntity_shouldReturnNull_whenInputIsNull() {
        assertNull(UserMapper.toEntity(null));
    }

    @Test
    void toDTO_shouldMapAllFields() {
        User user = new User();
        user.setEmail("user@example.com");
        user.setPhone("1234567890");

        UserDTO dto = UserMapper.toDTO(user);

        assertNotNull(dto);
        assertEquals("user@example.com", dto.getEmail());
        assertEquals("1234567890", dto.getPhone());
    }

    @Test
    void toEntity_shouldMapAllFields() {
        UserDTO dto = new UserDTO("test@demo.com", "9876543210");
        User user = UserMapper.toEntity(dto);

        assertNotNull(user);
        assertEquals("test@demo.com", user.getEmail());
        assertEquals("9876543210", user.getPhone());
    }
}