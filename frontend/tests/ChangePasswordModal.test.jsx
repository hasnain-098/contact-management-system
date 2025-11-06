import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChangePasswordModal from '../src/components/ChangePasswordModal'; 

global.fetch = jest.fn();

jest.mock('../src/utils/Icons', () => ({
    EyeIcon: (props) => <svg data-testid="eye-icon" {...props} />,
    EyeOffIcon: (props) => <svg data-testid="eye-off-icon" {...props} />,
    Spinner: () => <div data-testid="spinner"></div>,
}));

const API_URL = 'http://localhost:8080/api/auth/change-password';

const mockProps = {
    token: 'test-token-123',
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
    onLogout: jest.fn(),
};

const setup = (props = {}) => {
    return render(<ChangePasswordModal {...mockProps} {...props} />);
};

const fillForm = (oldPwd, newPwd, confirmPwd) => {
    fireEvent.change(screen.getByLabelText(/Current Password/i, { selector: '#oldPassword' }), { target: { value: oldPwd } });
    fireEvent.change(screen.getByLabelText(/New Password/i, { selector: '#newPassword' }), { target: { value: newPwd } });
    fireEvent.change(screen.getByLabelText(/Confirm New Password/i, { selector: '#confirmPassword' }), { target: { value: confirmPwd } });
};

const submitForm = async () => {
    await act(async () => {
        fireEvent.submit(screen.getByRole('button', { name: /Save Password/i }));
    });
};

describe('ChangePasswordModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    it('should render the modal structure and all input fields', () => {
        setup();
        
        expect(screen.getByRole('heading', { name: /Change Password/i })).toBeInTheDocument();
        expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
        expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Save Password/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('should update input values correctly', () => {
        setup();
        
        fillForm('old123', 'new456', 'new456');

        expect(screen.getByLabelText('Current Password')).toHaveValue('old123');
        expect(screen.getByLabelText('New Password')).toHaveValue('new456');
        expect(screen.getByLabelText('Confirm New Password')).toHaveValue('new456');
    });

    it('should toggle password visibility when eye icons are clicked', () => {
        setup();
        
        const oldPwdInput = screen.getByLabelText('Current Password');
        const newPwdInput = screen.getByLabelText('New Password');
        const confirmPwdInput = screen.getByLabelText('Confirm New Password');
        
        expect(oldPwdInput).toHaveAttribute('type', 'password');
        expect(newPwdInput).toHaveAttribute('type', 'password');
        
        const showOldButton = screen.getByRole('button', { name: /Show current password/i });
        const showNewButton = screen.getByRole('button', { name: /Show new password/i });
        
        fireEvent.click(showOldButton);
        expect(oldPwdInput).toHaveAttribute('type', 'text');
        expect(screen.getByRole('button', { name: /Hide current password/i })).toBeInTheDocument();
        
        fireEvent.click(showNewButton);
        expect(newPwdInput).toHaveAttribute('type', 'text');
        
        const showConfirmButton = screen.getByRole('button', { name: /Show confirmed password/i });
        fireEvent.click(showConfirmButton);
        expect(confirmPwdInput).toHaveAttribute('type', 'text');
    });

    it('should show error if any field is empty on submit', async () => {
        setup();
        
        fillForm('old123', 'new456', '');
        await submitForm();
        
        expect(screen.getByText('All fields are required.')).toBeInTheDocument();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should show error if new password is too short (less than 6 chars)', async () => {
        setup();
        
        fillForm('old123', 'new', 'new');
        await submitForm();
        
        expect(screen.getByText('New password must be at least 6 characters long.')).toBeInTheDocument();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should show error if new password and confirmation do not match', async () => {
        setup();
        
        fillForm('old123', 'new456', 'mismatch');
        await submitForm();
        
        expect(screen.getByText('New password and confirmation password do not match.')).toBeInTheDocument();
        expect(global.fetch).not.toHaveBeenCalled();
    });
    
    it('should show error if new password is the same as the current password', async () => {
        setup();
        
        fillForm('same123', 'same123', 'same123');
        await submitForm();
        
        expect(screen.getByText('New password must be different from the old password.')).toBeInTheDocument();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should call fetch correctly on successful submission and call onSuccess', async () => {
        let resolveFetch;
        const fetchPromise = new Promise(resolve => {
            resolveFetch = resolve;
        });

        global.fetch.mockImplementationOnce(() => fetchPromise);

        setup();
        fillForm('old123', 'new4567', 'new4567');
        
        const saveButton = screen.getByRole('button', { name: /Save Password/i });

        act(() => {
             fireEvent.submit(saveButton);
        });

        await waitFor(() => {
            expect(saveButton).toBeDisabled();
        });
        expect(screen.getByTestId('spinner')).toBeInTheDocument();

        await act(async () => {
            resolveFetch({
                ok: true,
                status: 200,
                json: async () => ({ message: 'Password updated' }),
            });
            await Promise.resolve();
        });

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(global.fetch).toHaveBeenCalledWith(API_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test-token-123' },
                body: JSON.stringify({ oldPassword: 'old123', newPassword: 'new4567' }),
            });
        });

        expect(mockProps.onSuccess).toHaveBeenCalledWith('Password updated successfully!');
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
        expect(saveButton).not.toBeDisabled();
    });

    it('should handle API failure (e.g., wrong old password) and display error', async () => {
        const apiError = 'Invalid current password.';
        
        let resolveFetch;
        const fetchPromise = new Promise(resolve => { resolveFetch = resolve; });
        global.fetch.mockImplementationOnce(() => fetchPromise);

        setup();
        fillForm('wrong123', 'new4567', 'new4567');
        const saveButton = screen.getByRole('button', { name: /Save Password/i });
        
        act(() => {
            fireEvent.submit(saveButton);
        });
        
        await waitFor(() => {
            expect(saveButton).toBeDisabled();
        });
        expect(screen.getByTestId('spinner')).toBeInTheDocument();

        await act(async () => {
            resolveFetch({
                ok: false,
                status: 400,
                json: async () => ({ error: apiError }),
            });
            await Promise.resolve();
        });

        await waitFor(() => {
            expect(screen.getByText(apiError)).toBeInTheDocument();
        });
        expect(mockProps.onSuccess).not.toHaveBeenCalled();
        expect(saveButton).not.toBeDisabled();
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
    });
    
    it('should call onLogout for 401/403 unauthorized response', async () => {
        let resolveFetch;
        const fetchPromise = new Promise(resolve => { resolveFetch = resolve; });
        global.fetch.mockImplementationOnce(() => fetchPromise);
        
        setup();
        fillForm('old123', 'new4567', 'new4567');
        const saveButton = screen.getByRole('button', { name: /Save Password/i });

        act(() => {
            fireEvent.submit(saveButton);
        });

        await waitFor(() => {
            expect(saveButton).toBeDisabled();
        });

        await act(async () => {
            resolveFetch({
                ok: false,
                status: 401,
                json: async () => ({}),
            });
            await Promise.resolve();
        });

        const expectedMessage = 'Session expired or unauthorized. Logging out.';
        await waitFor(() => {
             expect(mockProps.onLogout).toHaveBeenCalledWith(expectedMessage);
        });
       
        expect(screen.getByText(expectedMessage)).toBeInTheDocument();
        expect(mockProps.onSuccess).not.toHaveBeenCalled();
        expect(saveButton).not.toBeDisabled();
    });

    it('should call onCancel when the Cancel button is clicked', () => {
        setup();
        const cancelButton = screen.getByRole('button', { name: /Cancel/i });
        
        fireEvent.click(cancelButton);
        
        expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
        expect(mockProps.onSuccess).not.toHaveBeenCalled();
        expect(mockProps.onLogout).not.toHaveBeenCalled();
    });
});