import { formatDisplayName } from '../src/utils/Formatting';

describe('formatDisplayName', () => {

    it('should format a standard email with a dot into a display name', () => {
        const username = 'john.doe@example.com';
        expect(formatDisplayName(username)).toBe('John Doe');
    });

    it('should format an email with an underscore into a display name', () => {
        const username = 'jane_smith@example.com';
        expect(formatDisplayName(username)).toBe('Jane Smith');
    });

    it('should format a complex email with dots and underscores', () => {
        const username = 'mr.john_doe_smith@company.co.uk';
        expect(formatDisplayName(username)).toBe('Mr John Doe Smith');
    });

    it('should capitalize the first letter of a single-part email name', () => {
        const username = 'admin@server.com';
        expect(formatDisplayName(username)).toBe('Admin');
    });

    it('should return the original string if it is not an email', () => {
        const username = 'Already Formatted Name';
        expect(formatDisplayName(username)).toBe('Already Formatted Name');
    });

    it('should return "Guest User" for an empty string', () => {
        const username = '';
        expect(formatDisplayName(username)).toBe('Guest User');
    });

    it('should return "Guest User" for a null input', () => {
        const username = null;
        expect(formatDisplayName(username)).toBe('Guest User');
    });

    it('should return "Guest User" for an undefined input', () => {
        const username = undefined;
        expect(formatDisplayName(username)).toBe('Guest User');
    });

    it('should handle numbers in the email name part', () => {
        const username = 'user.123.test@example.com';
        expect(formatDisplayName(username)).toBe('User 123 Test');
    });

    it('should handle name parts that end in a separator (leading to empty strings)', () => {
        const username = 'john.doe.@example.com';

        expect(formatDisplayName(username)).toBe('John Doe '); 
    });

});