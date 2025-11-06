import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '../src/components/LoginPage';

jest.mock('../src/utils/Icons', () => ({
    EyeIcon: ({ className }) => <svg data-testid="eye-icon" className={className} />,
    EyeOffIcon: ({ className }) => <svg data-testid="eye-off-icon" className={className} />,
    Spinner: () => <div data-testid="spinner-mock" />,
}));

describe('LoginPage', () => {
    const mockOnLogin = jest.fn();
    const mockSwitchToRegister = jest.fn();

    const defaultProps = {
        onLogin: mockOnLogin,
        switchToRegister: mockSwitchToRegister,
        error: '',
        loading: false,
    };

    const getPasswordInput = () => screen.getByLabelText('Password');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders login form elements correctly', () => {
        render(<LoginPage {...defaultProps} />);

        expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/Email or Phone/i)).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument();
        expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    test('displays error message when error prop is provided', () => {
        const testError = "Invalid credentials provided.";
        render(<LoginPage {...defaultProps} error={testError} />);
        expect(screen.getByText(testError)).toBeInTheDocument();
    });
    
    test('updates identifier input state correctly', () => {
        render(<LoginPage {...defaultProps} />);
        const identifierInput = screen.getByLabelText(/Email or Phone/i);

        fireEvent.change(identifierInput, { target: { value: 'test@example.com' } });
        expect(identifierInput.value).toBe('test@example.com');
    });

    test('updates password input state correctly', () => {
        render(<LoginPage {...defaultProps} />);
        const passwordInput = getPasswordInput();

        fireEvent.change(passwordInput, { target: { value: 'securepwd' } });
        expect(passwordInput.value).toBe('securepwd');
    });

    test('toggles password visibility when eye button is clicked', () => {
        render(<LoginPage {...defaultProps} />);
        const passwordInput = getPasswordInput();
        const toggleButton = screen.getByRole('button', { name: /Show password/i });

        expect(passwordInput.getAttribute('type')).toBe('password');
        expect(screen.getByTestId('eye-icon')).toBeInTheDocument();

        fireEvent.click(toggleButton);
        expect(passwordInput.getAttribute('type')).toBe('text');
        expect(screen.getByRole('button', { name: /Hide password/i })).toBeInTheDocument();
        expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Hide password/i }));
        expect(passwordInput.getAttribute('type')).toBe('password');
        expect(screen.getByRole('button', { name: /Show password/i })).toBeInTheDocument();
        expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });
    
    test('calls onLogin with correct credentials on form submit', () => {
        render(<LoginPage {...defaultProps} />);
        
        const identifierInput = screen.getByLabelText(/Email or Phone/i);
        const passwordInput = getPasswordInput();
        const submitButton = screen.getByRole('button', { name: /Login/i });

        fireEvent.change(identifierInput, { target: { value: 'user@login.com' } });
        fireEvent.change(passwordInput, { target: { value: 'pass123' } });

        fireEvent.click(submitButton);

        expect(mockOnLogin).toHaveBeenCalledTimes(1);
        expect(mockOnLogin).toHaveBeenCalledWith('user@login.com', 'pass123');
    });

    test('calls switchToRegister when register button is clicked', () => {
        render(<LoginPage {...defaultProps} />);
        
        const registerButton = screen.getByRole('button', { name: /Register/i });
        
        fireEvent.click(registerButton);

        expect(mockSwitchToRegister).toHaveBeenCalledTimes(1);
    });

    test('disables inputs and shows spinner when loading is true', () => {
        render(<LoginPage {...defaultProps} loading={true} />);
        
        const identifierInput = screen.getByLabelText(/Email or Phone/i);
        const passwordInput = getPasswordInput();
        const loginButton = screen.getByRole('button', { name: /Logging in.../i });

        expect(identifierInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
        
        expect(screen.getByText(/Logging in.../i)).toBeInTheDocument();
        expect(screen.getByTestId('spinner-mock')).toBeInTheDocument();

        expect(loginButton).toBeDisabled();
    });

    test('login button is disabled when identifier or password fields are empty', () => {
        render(<LoginPage {...defaultProps} />);
        
        const loginButton = screen.getByRole('button', { name: /Login/i });

        expect(loginButton).toBeDisabled();
        
        fireEvent.change(screen.getByLabelText(/Email or Phone/i), { target: { value: 'user' } });
        expect(loginButton).toBeDisabled(); 

        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
        expect(loginButton).toBeEnabled();
    });

});