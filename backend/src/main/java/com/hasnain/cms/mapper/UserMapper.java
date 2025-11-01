package com.hasnain.cms.mapper;

import com.hasnain.cms.dto.UserDTO;
import com.hasnain.cms.entity.User;

public class UserMapper {

    public static UserDTO toDTO(User user) {
        if (user == null) {
            return null;
        }

        return new UserDTO(user.getEmail(), user.getPhone());
    }

    public static User toEntity(UserDTO userDTO) {

        if (userDTO == null) {
            return null;
        }

        User user = new User();
        user.setEmail(userDTO.getEmail());
        user.setPhone(userDTO.getPhone());
        return user;
    }
}
