import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditContactModal from '../src/components/EditContactModal';

const findErrorParagraph = async (expectedText) => {
  return await screen.findByText((content, element) => {
    if (element.tagName.toLowerCase() !== 'p') return false;
    const normalized = content.replace(/\s+/g, ' ').trim().toLowerCase();
    const normalizedExpected = expectedText.replace(/\.+$/, '').toLowerCase();
    return normalized.includes(normalizedExpected);
  });
};

global.fetch = jest.fn();

jest.mock('../src/utils/Validation', () => ({
    isValidEmail: jest.fn(email => email.includes('@') && email.includes('.')),
    isValidPhoneNumber: jest.fn(phone => phone.startsWith('+92') || phone.startsWith('03')),
}));

const API_BASE_URL = 'http://localhost:8080/api/contacts';

const mockContact = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    title: 'Developer',
    emails: [{ id: 10, label: 'Work', email: 'john.doe@work.com' }],
    phones: [{ id: 20, label: 'Mobile', phoneNumber: '+92-300-1234567' }],
};

const mockContactEmpty = {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    title: 'Manager',
    emails: [],
    phones: [],
};

const mockProps = {
    contact: mockContact,
    onSave: jest.fn(),
    onCancel: jest.fn(),
    token: 'test-token-456',
};

const setup = (props = {}) => {
    return render(<EditContactModal {...mockProps} {...props} />);
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

    const legendRegex = new RegExp(type.slice(0, -1), 'i'); // 'emails' -> /email/i
    const fieldset = screen.getByText(legendRegex, { selector: 'legend' }).closest('fieldset');
    const inputs = screen.getAllByLabelText(new RegExp(`^${fieldText}$`), { container: fieldset });
    
    fireEvent.change(inputs[index], {
        target: { value: value },
    });
};

describe('EditContactModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render the modal and pre-populate with contact data', () => {
        setup();
        expect(screen.getByRole('heading', { name: /Edit Contact/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/First Name/i)).toHaveValue(mockContact.firstName);
    });

    it('should render one blank email and phone field if contact arrays are empty', () => {
        setup({ contact: mockContactEmpty });
        expect(screen.getByLabelText(/First Name/i)).toHaveValue(mockContactEmpty.firstName);
        expect(screen.getAllByLabelText('Label')[0]).toHaveValue('');
    });

    it('should update state on main form field change', () => {
        setup();

        act(() => {
            fillMainForm('John-Updated', 'Doe-Updated', 'Senior Developer');
        });
        
        expect(screen.getByLabelText(/First Name/i)).toHaveValue('John-Updated');
        expect(screen.getByLabelText(/Last Name/i)).toHaveValue('Doe-Updated');
        expect(screen.getByLabelText(/Title/i)).toHaveValue('Senior Developer');
    });

    it('should update state on nested field change (email and phone)', () => {
        setup();
        
        act(() => {
            fillNestedForm('emails', 'Label', 0, 'Personal');
            fillNestedForm('emails', 'Email Address', 0, 'john@personal.com');
            fillNestedForm('phones', 'Label', 0, 'Work');
            fillNestedForm('phones', 'Phone Number', 0, '03009876543');
        });

        const emailFieldset = screen.getByText(/Email/i, { selector: 'legend' }).closest('fieldset');
        const emailLabel = screen.getAllByLabelText(/^Label$/, { container: emailFieldset })[0];
        const emailInput = screen.getByLabelText('Email Address');
        
        const phoneFieldset = screen.getByText(/Phone/i, { selector: 'legend' }).closest('fieldset');
        const phoneLabel = screen.getAllByLabelText(/^Label$/, { container: phoneFieldset })[0];
        const phoneInput = screen.getByLabelText('Phone Number');

        expect(emailLabel).toHaveValue('Work');
        expect(emailInput).toHaveValue('john@personal.com');
        expect(phoneLabel).toHaveValue('Work');
        expect(phoneInput).toHaveValue('03009876543');
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
            const form = document.getElementById('edit-contact-form');
            fireEvent.submit(form);
        });
        const errorElement = await screen.findByText(/First Name is required/i, {}, { timeout: 1500 });

        expect(errorElement).toBeInTheDocument();        
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should show error if no valid email AND no valid phone are provided', async () => {
        setup({ contact: mockContactEmpty });
        
        act(() => {
            fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
        });
        
        expect(
            await screen.findByText(/A contact must have at least one valid email or one valid phone number\.?/i)
        ).toBeInTheDocument();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should show error for invalid email', async () => {
        setup();

        act(() => {
            fillNestedForm('emails', 'Email Address', 0, 'invalid-email');
            const form = document.getElementById('edit-contact-form');
            fireEvent.submit(form);
        });
        
        const errorElement = await screen.findByText(/One or more email addresses are invalid/i, {}, { timeout: 1500 });

        expect(errorElement).toBeInTheDocument();        
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should show error for invalid phone number', async () => {
        setup();

        act(() => {
            fillNestedForm('phones', 'Phone Number', 0, '12345');
            fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
        });
        const errorElement = await findErrorParagraph(
            'One or more phone numbers are invalid (e.g., must match +92-xxx-xxxxxxx or 03xxxxxxxxx)'
        );

        expect(errorElement).toBeInTheDocument();
        expect(global.fetch).not.toHaveBeenCalled();
    });
    
    it('should pass validation with one valid email and blank phone', async () => {
        let resolveFetch;
        const fetchPromise = new Promise(resolve => { resolveFetch = resolve; });
        global.fetch.mockImplementationOnce(() => fetchPromise);

        setup({ contact: mockContactEmpty });
        
        act(() => {
            fillMainForm('Jane', 'Smith', 'Manager');
            fillNestedForm('emails', 'Email Address', 0, 'jane@valid.com');
        });
        
        act(() => {
            fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
        });
        
        expect(screen.queryByText(/A contact must have at least one/i)).not.toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
        });

        await act(async () => {
            resolveFetch({ ok: true, json: async () => ({}) });
            await Promise.resolve();
        });
    });

    it('should call fetch (PUT) with cleaned payload and call onSave on success', async () => {
        let resolveFetch;
        const fetchPromise = new Promise(resolve => { resolveFetch = resolve; });
        global.fetch.mockImplementationOnce(() => fetchPromise);
        
        const updatedContact = { ...mockContact, firstName: 'John-Updated' };
        
        setup();
        
        act(() => {
            fillMainForm('John-Updated');
        });
        const saveButton = screen.getByRole('button', { name: /Save Changes/i });

        act(() => {
            fireEvent.click(saveButton);
        });

        await waitFor(() => {
            expect(saveButton).toBeDisabled();
        });
        expect(saveButton).toHaveTextContent('Saving...');

        await act(async () => {
            resolveFetch({
                ok: true,
                status: 200,
                json: async () => updatedContact,
            });
            await Promise.resolve();
        });

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                `${API_BASE_URL}/${mockContact.id}`,
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify({
                        firstName: 'John-Updated', // The change
                        lastName: mockContact.lastName,
                        title: mockContact.title,
                        emails: mockContact.emails.map(e => ({ label: e.label, email: e.email })),
                        phones: mockContact.phones.map(p => ({ label: p.label, phoneNumber: p.phoneNumber })),
                    }),
                })
            );
            expect(mockProps.onSave).toHaveBeenCalledWith(updatedContact);
        });
        
        expect(saveButton).not.toBeDisabled();
        expect(saveButton).toHaveTextContent('Save Changes');
    });

    it('should show API error on fetch failure', async () => {
        let resolveFetch;
        const fetchPromise = new Promise(resolve => { resolveFetch = resolve; });
        global.fetch.mockImplementationOnce(() => fetchPromise);
        
        const apiError = 'Update failed from server';
        
        setup();
        const saveButton = screen.getByRole('button', { name: /Save Changes/i });

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
        fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
        expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
    });
});