import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserProfileModal from '../src/components/UserProfileModal'; 

jest.mock('../src/utils/Formatting', () => ({

    formatDisplayName: jest.fn(name => `Display Name for ${name}`),
}));

jest.mock('../src/utils/Icons', () => ({

    ProfileIcon: (props) => <svg data-testid="profile-icon" {...props} />,
}));

const mockProps = {
    username: 'test.user@company.com',
    onLogout: jest.fn(),
    onCancel: jest.fn(),
    onChangePasswordClick: jest.fn(),
};

const setup = (props = {}) => {


    return render(<UserProfileModal {...mockProps} {...props} />);
};

describe('UserProfileModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render the modal backdrop and content structure', () => {
        setup();
    
        expect(screen.getByText(/Display Name for test.user/i).closest('.fixed')).toHaveClass('inset-0');

        const contentArea = screen.getByRole('heading', { level: 3, name: /Display Name for test\.user/i }).closest('.relative');

        expect(contentArea).toBeInTheDocument();
        expect(contentArea).toHaveClass('shadow-2xl');
        expect(screen.getByLabelText('Close Profile')).toBeInTheDocument();
    });

    it('should display the formatted display name and raw username', () => {
        setup();

        const rawUsername = mockProps.username;
        const expectedDisplayName = `Display Name for ${rawUsername}`;
        
        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(expectedDisplayName);
        expect(screen.getByText(rawUsername)).toBeInTheDocument();
        expect(screen.getByTestId('profile-icon')).toBeInTheDocument();
    });

    it('should call onCancel when the close button is clicked', () => {
        setup();

        const closeButton = screen.getByLabelText('Close Profile');
        
        fireEvent.click(closeButton);
        
        expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
        expect(mockProps.onLogout).not.toHaveBeenCalled();
        expect(mockProps.onChangePasswordClick).not.toHaveBeenCalled();
    });

    it('should call onChangePasswordClick when the "Change Password" button is clicked', () => {
        setup();

        const changePasswordButton = screen.getByRole('button', { name: /Change Password/i });
        
        fireEvent.click(changePasswordButton);
        
        expect(mockProps.onChangePasswordClick).toHaveBeenCalledTimes(1);
        expect(mockProps.onCancel).not.toHaveBeenCalled();
        expect(mockProps.onLogout).not.toHaveBeenCalled();
    });

    it('should call onLogout when the "Log Out" button is clicked', () => {
        setup();

        const logoutButton = screen.getByRole('button', { name: /Log Out/i });
        
        fireEvent.click(logoutButton);
        
        expect(mockProps.onLogout).toHaveBeenCalledTimes(1);
        expect(mockProps.onCancel).not.toHaveBeenCalled();
        expect(mockProps.onChangePasswordClick).not.toHaveBeenCalled();
    });
    
});