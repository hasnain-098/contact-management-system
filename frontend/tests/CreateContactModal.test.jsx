import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreateContactModal from '../src/components/CreateContactModal';

global.fetch = jest.fn();

jest.mock('../src/utils/Validation', () => ({
    isValidEmail: jest.fn(email => email.includes('@') && email.includes('.')),
    isValidPhoneNumber: jest.fn(phone => phone.startsWith('+92') || phone.startsWith('03')),
}));

const API_BASE_URL = 'http://localhost:8080/api/contacts';

const mockProps = {
    onSave: jest.fn(),
    onCancel: jest.fn(),
    token: 'test-token-789',
};

const setup = (props = {}) => {
    return render(<CreateContactModal {...mockProps} {...props} />);
};

const fillMainForm = (firstName, lastName, title) => {
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: firstName } });
    if (lastName !== undefined) {
        fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: lastName } });
    }
    if (title !== undefined) {
        fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: title } });
    }
};

const fillNestedForm = (type, fieldText, index, value) => {

    const legendRegex = new RegExp(type.slice(0, -1), 'i');
    const fieldset = screen.getByText(legendRegex, { selector: 'legend' }).closest('fieldset');
    
    const inputs = screen.getAllByLabelText(new RegExp(`^${fieldText}$`), { container: fieldset });
    
    fireEvent.change(inputs[index], {
        target: { value: value },
    });
};

describe('CreateContactModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render the modal with a blank form', () => {
        setup();
        expect(screen.getByRole('heading', { name: /Create New Contact/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/First Name/i)).toHaveValue('');
    });

    it('should update state on main form field change', () => {
        setup();

        act(() => {
            fillMainForm('New', 'Contact', 'Tester');
        });
        
        expect(screen.getByLabelText(/First Name/i)).toHaveValue('New');
        expect(screen.getByLabelText(/Last Name/i)).toHaveValue('Contact');
        expect(screen.getByLabelText(/Title/i)).toHaveValue('Tester');
    });

    it('should update state on nested field change (email and phone)', () => {
        setup();
        
        fireEvent.change(screen.getAllByLabelText('Label')[0], {
            target: { value: 'Work' },
        });
        fireEvent.change(screen.getAllByLabelText('Email Address')[0], {
            target: { value: 'new@work.com' },
        });

        fireEvent.change(screen.getAllByLabelText('Label')[1], {
            target: { value: 'Mobile' },
        });
        fireEvent.change(screen.getAllByLabelText('Phone Number')[0], {
            target: { value: '03001234567' },
        });

        const emailFieldset = screen.getByTestId('email-fieldset');
        const phoneFieldset = screen.getByTestId('phone-fieldset');

        const [emailLabel, phoneLabel] = screen.getAllByLabelText('Label');

        const emailInput = within(emailFieldset).getByLabelText('Email Address');
        const phoneInput = within(phoneFieldset).getByLabelText('Phone Number');

        expect(emailLabel).toHaveValue('Work');
        expect(emailInput).toHaveValue('new@work.com');
        expect(phoneLabel).toHaveValue('Mobile');
        expect(phoneInput).toHaveValue('03001234567');
    });

    it('should add a new email field when "+ Add Email" is clicked', () => {
        setup();
        expect(screen.getAllByLabelText('Email Address')).toHaveLength(1);
        
        act(() => {
            fireEvent.click(screen.getByRole('button', { name: /\+ Add Email/i }));
        });
        
        const emailInputs = screen.getAllByLabelText('Email Address');
        expect(emailInputs).toHaveLength(2);
        expect(emailInputs[1]).toHaveValue('');
    });

    it('should add a new phone field when "+ Add Phone" is clicked', () => {
        setup();
        expect(screen.getAllByLabelText('Phone Number')).toHaveLength(1);
        
        act(() => {
            fireEvent.click(screen.getByRole('button', { name: /\+ Add Phone/i }));
        });
        
        const phoneInputs = screen.getAllByLabelText('Phone Number');
        expect(phoneInputs).toHaveLength(2);
        expect(phoneInputs[1]).toHaveValue('');
    });

    it('should remove an email field when "Remove" is clicked', () => {
        setup();
        
        act(() => {
            fireEvent.click(screen.getByRole('button', { name: /\+ Add Email/i }));
        });
        expect(screen.getAllByLabelText('Email Address')).toHaveLength(2);

        act(() => {
            fireEvent.click(screen.getByRole('button', { name: 'Remove email 1' }));
        });
        
        expect(screen.getAllByLabelText('Email Address')).toHaveLength(1);
    });



    it('should show error if First Name is missing', async () => {
        setup();
        
        act(() => {
            fillMainForm('', 'Doe', 'Title');
            const form = document.getElementById('create-contact-form');
            fireEvent.submit(form);
        });
        const errorElement = await screen.findByText(/First Name is required/i, {}, { timeout: 1500 });
        
        expect(errorElement).toBeInTheDocument();  
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should show error if no valid email AND no valid phone are provided', async () => {
        setup();

        act(() => {
            fillMainForm('Test', 'User');
            fireEvent.click(screen.getByRole('button', { name: /Create Contact/i }));
        });
        
        expect(await screen.findByText('A contact must have at least one valid email or one valid phone number.')).toBeInTheDocument();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should show error for invalid email', async () => {
        setup();

        act(() => {
            fillMainForm('Test', 'User');
            fillNestedForm('emails', 'Email Address', 0, 'invalid-email');
            const form = document.getElementById('create-contact-form');
            fireEvent.submit(form);
        });

        const errorElement = await screen.findByText(/One or more email addresses are invalid/i, {}, { timeout: 1500 });
        
        expect(errorElement).toBeInTheDocument();  
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should show error for invalid phone number', async () => {
        setup();

        act(() => {
            fillMainForm('Test', 'User');
            fillNestedForm('phones', 'Phone Number', 0, '12345');
            fireEvent.click(screen.getByRole('button', { name: /Create Contact/i }));
        });
        
        expect(await screen.findByText(/One or more phone numbers are invalid/i)).toBeInTheDocument();
        expect(global.fetch).not.toHaveBeenCalled();
    });
    
    it('should pass validation with one valid phone and blank email', async () => {
        let resolveFetch;
        const fetchPromise = new Promise(resolve => { resolveFetch = resolve; });
        global.fetch.mockImplementationOnce(() => fetchPromise);

        setup();
        
        act(() => {
            fillMainForm('Jane', 'Smith', 'Manager');
            fillNestedForm('phones', 'Phone Number', 0, '03001234567'); // Valid phone
        });
        
        act(() => {
            fireEvent.click(screen.getByRole('button', { name: /Create Contact/i }));
        });
        
        expect(screen.queryByText(/A contact must have at least one/i)).not.toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Creating...' })).toBeDisabled();
        });

        await act(async () => {
            resolveFetch({ ok: true, json: async () => ({}) });
            await Promise.resolve();
        });
    });

    it('should call fetch (POST) with cleaned payload and call onSave on success', async () => {
        let resolveFetch;
        const fetchPromise = new Promise(resolve => { resolveFetch = resolve; });
        global.fetch.mockImplementationOnce(() => fetchPromise);
        
        const newContact = { 
            firstName: 'New', 
            lastName: 'Contact', 
            title: 'Tester',
            emails: [{ label: 'Work', email: 'new@work.com' }],
            phones: []
        };
        const apiResponse = { ...newContact, id: 100 };
        
        setup();
        
        act(() => {
            fillMainForm('New', 'Contact', 'Tester');
            fillNestedForm('emails', 'Label', 0, 'Work');
            fillNestedForm('emails', 'Email Address', 0, 'new@work.com');
        });
        
        const saveButton = screen.getByRole('button', { name: /Create Contact/i });

        act(() => {
            fireEvent.click(saveButton);
        });

        await waitFor(() => {
            expect(saveButton).toBeDisabled();
        });
        expect(saveButton).toHaveTextContent('Creating...');

        await act(async () => {
            resolveFetch({
                ok: true,
                status: 201,
                json: async () => apiResponse,
            });
            await Promise.resolve();
        });

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                API_BASE_URL,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(newContact),
                })
            );
            expect(mockProps.onSave).toHaveBeenCalledWith(apiResponse);
        });
        
        expect(saveButton).not.toBeDisabled();
        expect(saveButton).toHaveTextContent('Create Contact');
    });

    it('should show API error on fetch failure', async () => {
        let resolveFetch;
        const fetchPromise = new Promise(resolve => { resolveFetch = resolve; });
        global.fetch.mockImplementationOnce(() => fetchPromise);
        
        const apiError = 'Server is down';
        
        setup();
        act(() => {
            fillMainForm('Test', 'User');
            fillNestedForm('emails', 'Email Address', 0, 'test@example.com');
        });
        const saveButton = screen.getByRole('button', { name: /Create Contact/i });

        act(() => {
            fireEvent.click(saveButton);
        });
        
        await waitFor(() => {
            expect(saveButton).toBeDisabled();
        });

        await act(async () => {
            resolveFetch({
                ok: false,
                status: 500,
                json: async () => ({ error: apiError }),
            });
            await Promise.resolve();
        });

        await waitFor(() => {
            expect(screen.getByText(apiError)).toBeInTheDocument();
        });
        expect(mockProps.onSave).not.toHaveBeenCalled();
        expect(saveButton).not.toBeDisabled();
    });

    it('should call onCancel when Cancel button is clicked', () => {
        setup();
        const cancelButton = screen.getByRole('button', { name: /Cancel/i });
        fireEvent.click(cancelButton);
        expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it('should disable cancel button while processing', async () => {
        let resolveFetch;
        const fetchPromise = new Promise(resolve => { resolveFetch = resolve; });
        global.fetch.mockImplementationOnce(() => fetchPromise);
        
        setup();
        act(() => {
             fillMainForm('Test', 'User');
             fillNestedForm('emails', 'Email Address', 0, 'test@test.com');
        });
        
        act(() => {
            fireEvent.click(screen.getByRole('button', { name: /Create Contact/i }));
        });

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
        });

        await act(async () => {
            resolveFetch({ ok: true, json: async () => ({}) });
            await Promise.resolve();
        });
    });
});