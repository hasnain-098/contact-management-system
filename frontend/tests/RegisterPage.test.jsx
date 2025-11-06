import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegisterPage from '../src/components/RegisterPage';

jest.mock('../src/utils/Icons', () => ({
    EyeIcon: ({ className }) => <svg data-testid="eye-icon" className={className} />,
    EyeOffIcon: ({ className }) => <svg data-testid="eye-off-icon" className={className} />,
    Spinner: () => <div data-testid="spinner"></div>,
}));

const defaultProps = {
    onRegister: jest.fn(),
    switchToLogin: jest.fn(),
    error: '',
    loading: false,
};

const setup = (props = {}) => {
    const combinedProps = { ...defaultProps, ...props };
    render(<RegisterPage {...combinedProps} />);
    return { ...combinedProps };
};

describe('RegisterPage', () => {
    const getIdentifierInput = () => screen.getByLabelText(/email or phone/i);
    const getPasswordInput = () => screen.getByLabelText('Password');
    const getConfirmPasswordInput = () => screen.getByLabelText('Confirm Password');
    const getRegisterButton = () => screen.getByRole('button', { name: /register/i });
    const getLoginButton = () => screen.getByRole('button', { name: /login/i });

    const findToggleButtonFor = (inputLabel) => {
        const input = screen.getByLabelText(inputLabel);
        return input.closest('div.relative')?.querySelector('button');
    };

    const getIconForButton = (button, iconTestId) => {
        return button.querySelector(`[data-testid="${iconTestId}"]`);
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the registration form correctly', () => {
        setup();
        expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
        expect(getIdentifierInput()).toBeInTheDocument();
        expect(getPasswordInput()).toBeInTheDocument();
        expect(getConfirmPasswordInput()).toBeInTheDocument();
        expect(getRegisterButton()).toBeInTheDocument();
        expect(getLoginButton()).toBeInTheDocument();
    });

    it('updates identifier, password, and confirm password states on change', () => {
        setup();

        fireEvent.change(getIdentifierInput(), { target: { value: 'test@example.com' } });
        expect(getIdentifierInput().value).toBe('test@example.com');

        fireEvent.change(getPasswordInput(), { target: { value: 'password123' } });
        expect(getPasswordInput().value).toBe('password123');

        fireEvent.change(getConfirmPasswordInput(), { target: { value: 'password123' } });
        expect(getConfirmPasswordInput().value).toBe('password123');
    });

    it('toggles password visibility for the password field', () => {
        setup();
        const passwordInput = getPasswordInput();
        const toggleButton = findToggleButtonFor('Password');

        expect(passwordInput.type).toBe('password');
        expect(getIconForButton(toggleButton, 'eye-icon')).toBeInTheDocument();

        fireEvent.click(toggleButton);
        expect(passwordInput.type).toBe('text');
        expect(getIconForButton(toggleButton, 'eye-off-icon')).toBeInTheDocument();
        
        fireEvent.click(toggleButton);
        expect(passwordInput.type).toBe('password');
        expect(getIconForButton(toggleButton, 'eye-icon')).toBeInTheDocument();
    });

    it('toggles password visibility for the confirm password field', () => {
        setup();
        const confirmInput = getConfirmPasswordInput();
        const toggleButton = findToggleButtonFor('Confirm Password');

        expect(confirmInput.type).toBe('password');
        expect(getIconForButton(toggleButton, 'eye-icon')).toBeInTheDocument();

        fireEvent.click(toggleButton);
        expect(confirmInput.type).toBe('text');
        expect(getIconForButton(toggleButton, 'eye-off-icon')).toBeInTheDocument();
    });

    it('shows a match error when passwords do not match', () => {
        setup();

        fireEvent.change(getPasswordInput(), { target: { value: 'pass1' } });
        fireEvent.change(getConfirmPasswordInput(), { target: { value: 'pass2' } });

        expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
        expect(getRegisterButton()).toBeDisabled();
    });

    it('removes the match error when passwords match', async () => {
        setup();

        fireEvent.change(getPasswordInput(), { target: { value: 'passA' } });
        fireEvent.change(getConfirmPasswordInput(), { target: { value: 'passB' } });
        expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();

        fireEvent.change(getConfirmPasswordInput(), { target: { value: 'passA' } });

        await waitFor(() => {
            expect(screen.queryByText('Passwords do not match.')).not.toBeInTheDocument();
            expect(getRegisterButton()).not.toBeDisabled();
        });
    });

    it('calls onRegister with correct data on valid submission', async () => {
        const onRegisterMock = jest.fn();
        setup({ onRegister: onRegisterMock });

        const identifier = 'user@test.com';
        const password = 'securepassword';

        fireEvent.change(getIdentifierInput(), { target: { value: identifier } });
        fireEvent.change(getPasswordInput(), { target: { value: password } });
        fireEvent.change(getConfirmPasswordInput(), { target: { value: password } });

        fireEvent.click(getRegisterButton());

        await waitFor(() => {
            expect(onRegisterMock).toHaveBeenCalledTimes(1);
            expect(onRegisterMock).toHaveBeenCalledWith(identifier, password);
        });
    });

    it('does not call onRegister on submission if passwords do not match', () => {
        const onRegisterMock = jest.fn();
        setup({ onRegister: onRegisterMock });

        fireEvent.change(getIdentifierInput(), { target: { value: 'user@test.com' } });
        fireEvent.change(getPasswordInput(), { target: { value: 'pass1' } });
        fireEvent.change(getConfirmPasswordInput(), { target: { value: 'pass2' } });

        fireEvent.click(getRegisterButton());

        expect(onRegisterMock).not.toHaveBeenCalled();
    });

    it('disables the button if any required field is empty', () => {
        setup();
        expect(getRegisterButton()).toBeDisabled();

        fireEvent.change(getIdentifierInput(), { target: { value: 'a' } });
        expect(getRegisterButton()).toBeDisabled();

        fireEvent.change(getPasswordInput(), { target: { value: 'p' } });
        fireEvent.change(getConfirmPasswordInput(), { target: { value: 'p' } });
        expect(getRegisterButton()).not.toBeDisabled();
    });

    it('displays the error message when the error prop is present', () => {
        const errorMessage = 'Registration failed. Try again.';
        setup({ error: errorMessage });

        expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('displays loading state and disables the form fields when loading is true', () => {
        setup({ loading: true });

        expect(screen.getByText('Registering...')).toBeInTheDocument();
        expect(screen.getByTestId('spinner')).toBeInTheDocument();
        expect(getRegisterButton()).toBeDisabled();

        const passwordToggleButton = findToggleButtonFor('Password');
        const confirmToggleButton = findToggleButtonFor('Confirm Password');

        expect(passwordToggleButton).toBeDisabled();
        expect(confirmToggleButton).toBeDisabled();
    });

    it('calls switchToLogin when the Login button is clicked', () => {
        const switchToLoginMock = jest.fn();
        setup({ switchToLogin: switchToLoginMock });

        fireEvent.click(getLoginButton());
        expect(switchToLoginMock).toHaveBeenCalledTimes(1);
    });
    
});