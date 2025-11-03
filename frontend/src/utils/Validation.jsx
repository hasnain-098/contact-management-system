export const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPhoneNumber = (phone) => {
    return /^(?:\+92-\d{3}-\d{7}|03\d{9})$/.test(phone);
};