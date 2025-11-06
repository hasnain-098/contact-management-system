import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContactListPage from '../src/components/ContactListPage';

const mockContacts = [
    { id: 1, firstName: 'Alice', lastName: 'Johnson', title: 'Developer', emails: [{ label: 'Work', email: 'alice@example.com' }], phones: [{ label: 'Cell', phoneNumber: '123-456-7890' }] },
    { id: 2, firstName: 'Bob', lastName: 'Smith', title: 'Manager', emails: [{ label: 'Personal', email: 'bob@example.com' }], phones: [{ label: '', phoneNumber: '' }] },
];

const mockTenContacts = Array.from({ length: 11 }, (_, i) => ({
    id: i + 1, firstName: `Test${i + 1}`, lastName: 'User', title: `Title${i + 1}`,
    emails: [{ email: `test${i + 1}@example.com`, label: 'Work' }], phones: [{ label: '', phoneNumber: '' }]
}));

const lastContact = [{
    id: 11, firstName: 'Test11', lastName: 'User', title: 'Title11',
    emails: [{ email: 'test11@example.com', label: 'Work' }], phones: [{ label: '', phoneNumber: '' }]
}];

const page0ContactsArray = mockTenContacts.slice(0, 10);

jest.mock('../src/components/EditContactModal', () => (props) => props.contact ? <div data-testid="edit-modal">Edit: {props.contact.firstName}</div> : null);
jest.mock('../src/components/DeleteConfirmationModal', () => (props) => props.isOpen ? <div data-testid="delete-modal" onClick={props.onConfirm}>Delete: {props.contactName}</div> : null);
jest.mock('../src/components/CreateContactModal', () => (props) => props.onSave ? <div data-testid="create-modal" onClick={() => props.onSave({ id: 3 })}>Create Modal</div> : null);
jest.mock('../src/components/UserProfileModal', () => (props) => props.username ? <div data-testid="profile-modal" onClick={props.onChangePasswordClick}>Profile Modal</div> : null);
jest.mock('../src/components/ChangePasswordModal', () => (props) => props.onSuccess ? <div data-testid="change-password-modal" onClick={() => props.onSuccess('Pwd Changed')}>Change Password Modal</div> : null);

jest.mock('../src/utils/Formatting', () => ({
    formatDisplayName: jest.fn(name => name.toUpperCase()),
}));
jest.mock('../src/utils/Icons', () => ({
    ProfileIcon: (props) => <svg data-testid="profile-icon" {...props} />,
    Spinner: () => <div data-testid="spinner"></div>,
}));

global.fetch = jest.fn();

const API_BASE_URL = 'http://localhost:8080/api/contacts';

const mockFetchSuccess = (data, isLastPage = true) => {
    global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => data,
        status: 200,
        text: async () => JSON.stringify(data),
    });
};

const mockFetchFailure = (status = 500, errorMsg = 'Server Error', isJson = true) => {
    global.fetch.mockResolvedValueOnce({
        ok: false,
        status: status,
        json: async () => (isJson ? { error: errorMsg } : {}),
        text: async () => (isJson ? JSON.stringify({ error: errorMsg }) : errorMsg),
    });
};

const defaultProps = {
    token: 'fake-jwt-token',
    username: 'test.user',
    onLogout: jest.fn(),
};

const setup = (props = {}) => {
    const combinedProps = { ...defaultProps, ...props };
    render(<ContactListPage {...combinedProps} />);
    return { ...combinedProps };
};

const advanceTimersAndAwait = async (time = 500) => {
    await act(async () => {
        jest.advanceTimersByTime(time);
        await Promise.resolve();
    });
};

const awaitFetchResolution = async () => {
    await act(async () => {
        await Promise.resolve();
    });
}

const getPageDisplay = () => screen.getByTestId('page-number');

describe('ContactListPage', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should show loading state and fetch contacts on mount', async () => {
        mockFetchSuccess(mockContacts);
        setup();

        expect(screen.getByText('Loading contacts...')).toBeInTheDocument();

        await advanceTimersAndAwait();

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                `${API_BASE_URL}?page=0&size=10`,
                expect.objectContaining({ headers: { 'Authorization': 'Bearer fake-jwt-token', 'Content-Type': 'application/json' } })
            );
            expect(screen.queryByText('Loading contacts...')).not.toBeInTheDocument();
            expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
            expect(screen.getByText('Developer')).toBeInTheDocument();
            expect(screen.getByText('Work:')).toBeInTheDocument();
            expect(screen.getByText('Page 1')).toBeInTheDocument();
        });
    });

    it('should display contacts error message on fetch failure', async () => {
        const errorMsg = 'Failed to load contacts.';
        mockFetchFailure(500, errorMsg);
        setup();

        await advanceTimersAndAwait();

        await waitFor(() => {
            expect(screen.getByText(errorMsg)).toBeInTheDocument();
            expect(screen.queryByText('Loading contacts...')).not.toBeInTheDocument();
        });
    });

    it('should call onLogout on fetch 401/403 (Session Expired)', async () => {
        mockFetchFailure(401, 'Session expired or invalid. Please log in again.');
        const { onLogout } = setup();

        await advanceTimersAndAwait();

        await waitFor(() => {
            expect(screen.getByText(/Session expired or invalid/i)).toBeInTheDocument();
            expect(onLogout).toHaveBeenCalledTimes(1);
        });
    });

    it('should display "You have no contacts yet" when list is empty and no search is active', async () => {
        mockFetchSuccess([]);
        setup();

        await advanceTimersAndAwait();

        await waitFor(() => {
            expect(screen.getByText('You have no contacts yet.')).toBeInTheDocument();
        });
    });

    it('should debounce search input and trigger fetch with query', async () => {
        mockFetchSuccess(mockContacts);
        setup();

        await advanceTimersAndAwait();

        fireEvent.change(screen.getByPlaceholderText(/Search by first or last name/i), { target: { value: 'Alice' } });

        expect(screen.getByPlaceholderText(/Search by first or last name/i)).toHaveValue('Alice');
        expect(global.fetch).toHaveBeenCalledTimes(1);

        await advanceTimersAndAwait();

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(global.fetch).toHaveBeenCalledWith(
                `${API_BASE_URL}?page=0&size=10&search=Alice`,
                expect.any(Object)
            );
        });

        mockFetchSuccess([]);
        fireEvent.change(screen.getByPlaceholderText(/Search by first or last name/i), { target: { value: 'Zzz' } });
        await advanceTimersAndAwait();
        await waitFor(() => {
            expect(screen.getByText('No contacts found matching your search.')).toBeInTheDocument();
        });
    });

    it('should handle pagination correctly', async () => {
        mockFetchSuccess(mockTenContacts);
        setup();
        await advanceTimersAndAwait();

        await waitFor(() => {
            expect(screen.getByText('Page 1')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
            expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
        });

        mockFetchSuccess(mockContacts);
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
        await awaitFetchResolution();

        await waitFor(() => {
            expect(screen.getByText('Page 2')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /previous/i })).not.toBeDisabled();
            expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
        });

        mockFetchSuccess(mockTenContacts);
        fireEvent.click(screen.getByRole('button', { name: /previous/i }));
        await awaitFetchResolution();

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('page=0'), expect.any(Object));
            expect(screen.getByText('Page 1')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
            expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
        });
    });

    it('should open CreateContactModal when "Add New Contact" is clicked', async () => {
        mockFetchSuccess([]);
        setup();
        await advanceTimersAndAwait();

        fireEvent.click(screen.getByRole('button', { name: /Add New Contact/i }));
        expect(screen.getByTestId('create-modal')).toBeInTheDocument();
    });

    it('should close CreateContactModal and refresh contacts on successful creation', async () => {
        mockFetchSuccess([]);
        mockFetchSuccess(mockContacts.slice(0, 1));
        setup();
        await advanceTimersAndAwait();

        fireEvent.click(screen.getByRole('button', { name: /Add New Contact/i }));
        expect(screen.getByTestId('create-modal')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('create-modal'));

        await awaitFetchResolution();

        await waitFor(() => {
            expect(screen.queryByTestId('create-modal')).not.toBeInTheDocument();
            expect(screen.getByText('Contact created successfully')).toBeInTheDocument();
            expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });

    it('should open EditContactModal when "Edit" button is clicked', async () => {
        mockFetchSuccess(mockContacts);
        setup();
        await advanceTimersAndAwait();

        const editButton = screen.getAllByRole('button', { name: 'Edit' })[0];
        fireEvent.click(editButton);

        expect(screen.getByTestId('edit-modal')).toHaveTextContent('Edit: Alice');
    });

    it('should open DeleteConfirmModal when "Delete" button is clicked', async () => {
        mockFetchSuccess(mockContacts);
        setup();
        await advanceTimersAndAwait();

        const deleteButton = screen.getAllByRole('button', { name: 'Delete' })[1];
        fireEvent.click(deleteButton);

        expect(screen.getByTestId('delete-modal')).toHaveTextContent('Delete: Bob Smith');
    });

    it('should handle contact deletion successfully and refresh list', async () => {

        mockFetchSuccess(mockContacts);

        global.fetch.mockResolvedValueOnce({ ok: true, status: 204, text: async () => '' });

        mockFetchSuccess(mockContacts.slice(1));
        setup();
        await advanceTimersAndAwait();

        const deleteButton = screen.getAllByRole('button', { name: 'Delete' })[0];
        fireEvent.click(deleteButton);

        fireEvent.click(screen.getByTestId('delete-modal'));

        await waitFor(() => {
            expect(screen.queryByTestId('delete-modal')).not.toBeInTheDocument();
            expect(global.fetch).toHaveBeenCalledTimes(3);
            expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
            expect(screen.getByText('Bob Smith')).toBeInTheDocument();
        });
    });

    it('should decrement page number when deleting the last contact on a page', async () => {

        global.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => page0ContactsArray,
                status: 200,
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => lastContact,
                status: 200,
            })
            .mockResolvedValueOnce({
                ok: true,
                status: 204,
                text: async () => ''
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => page0ContactsArray,
                status: 200,
            });

        setup();
        await advanceTimersAndAwait();

        await waitFor(() => {
            expect(screen.getByTestId('page-number')).toHaveTextContent('Page 1');
            expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
        });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /next/i }));
            await Promise.resolve();
        });

        await waitFor(() => {

            expect(screen.getByTestId('page-number')).toHaveTextContent('Page 2');
            expect(screen.getByText('Test11 User')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
        });

        const deleteButton = screen.getByRole('button', { name: 'Delete' });
        fireEvent.click(deleteButton);

        await act(async () => {

            fireEvent.click(screen.getByTestId('delete-modal'));
            await Promise.resolve();
        });

        await waitFor(() => {

            expect(global.fetch).toHaveBeenCalledTimes(4);
            expect(global.fetch.mock.calls[3][0]).toContain('page=0');

            expect(screen.getByTestId('page-number')).toHaveTextContent('Page 1');

            expect(screen.getByText('Test1 User')).toBeInTheDocument();
            expect(screen.queryByText('Test11 User')).not.toBeInTheDocument();
        });
    });

    it('should open Profile Modal when Profile Icon is clicked', async () => {
        mockFetchSuccess([]);
        setup();
        await advanceTimersAndAwait();

        fireEvent.click(screen.getByLabelText(/User Profile and Logout/i));

        expect(screen.getByTestId('profile-modal')).toBeInTheDocument();
    });

    it('should chain from Profile Modal to Change Password Modal', async () => {
        mockFetchSuccess([]);
        setup();
        await advanceTimersAndAwait();

        fireEvent.click(screen.getByLabelText(/User Profile and Logout/i));
        const profileModal = screen.getByTestId('profile-modal');
        expect(profileModal).toBeInTheDocument();

        fireEvent.click(profileModal);

        expect(screen.queryByTestId('profile-modal')).not.toBeInTheDocument();
        expect(screen.getByTestId('change-password-modal')).toBeInTheDocument();
    });

    it('should close Change Password Modal and show success message on success', async () => {
        mockFetchSuccess([]);
        setup();
        await advanceTimersAndAwait();

        fireEvent.click(screen.getByLabelText(/User Profile and Logout/i));
        fireEvent.click(screen.getByTestId('profile-modal'));
        const changePwdModal = screen.getByTestId('change-password-modal');

        fireEvent.click(changePwdModal);

        await waitFor(() => {
            expect(screen.queryByTestId('change-password-modal')).not.toBeInTheDocument();

            expect(screen.getByText('Pwd Changed')).toBeInTheDocument();
        });
    });
});