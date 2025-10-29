import React, { useState, useEffect } from 'react';
import EditContactModal from './EditContactModal';
import DeleteConfirmModal from './DeleteConfirmationModal';

const API_BASE_URL = 'http://localhost:8080/api/contacts'; // Or your actual backend URL

function ContactListPage({ token, username, onLogout }) {
    const [contacts, setContacts] = useState([]);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [contactsError, setContactsError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [isLastPage, setIsLastPage] = useState(false);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

    // --- State for Edit/Delete ---
    const [editingContact, setEditingContact] = useState(null);
    const [actionError, setActionError] = useState('');
    const [isProcessingAction, setIsProcessingAction] = useState(false);

    const [deletingContact, setDeletingContact] = useState(null);

    // --- Debounce Effect ---
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPage(0);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // --- Fetch Contacts Function ---
    const fetchContacts = async (currentPage = 0, currentSearch = '') => {
        setLoadingContacts(true);
        setContactsError('');
        console.log(`Fetching contacts for ${username}. Page: ${currentPage}, Search: '${currentSearch}'`);
        try {
            const queryParams = new URLSearchParams({ page: currentPage.toString(), size: size.toString() });
            if (currentSearch && currentSearch.trim()) queryParams.append('search', currentSearch.trim());
            const response = await fetch(`${API_BASE_URL}?${queryParams.toString()}`, {
                method: 'GET', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) throw new Error('Session expired or invalid. Please log in again.');
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to fetch contacts: ${response.statusText || response.status}`);
            }
            const data = await response.json();
            console.log('Contacts received:', data);
            setContacts(data);
            setPage(currentPage);
            setIsLastPage(data.length < size);
        } catch (err) {
            console.error('Error fetching contacts:', err);
            setContactsError(err.message || 'Could not load contacts.');
            if (err.message.includes('Session expired')) onLogout();
        } finally {
            setLoadingContacts(false);
        }
    };

    // --- Fetch Effect ---
    useEffect(() => {
        if (token) fetchContacts(page, debouncedSearchTerm);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, debouncedSearchTerm, page, size, onLogout]);

    // --- Handlers ---
    const handleSearchChange = (event) => setSearchTerm(event.target.value);
    const handleNextPage = () => { if (!isLastPage) setPage(p => p + 1); };
    const handlePrevPage = () => setPage(p => Math.max(0, p - 1));

    // --- Edit and Delete Handlers ---
    const handleEditClick = (contact) => {
        setActionError('');
        setEditingContact(contact);
    };

    const handleModalCancel = () => {
        setEditingContact(null);
        setActionError('');
    };

    const handleUpdateContact = (updatedContact) => {
        fetchContacts(page, debouncedSearchTerm); // Refetch list after update
        setEditingContact(null);
        setActionError('');
    };

    const handleDeleteClick = (contact) => {
        setActionError('');
        setDeletingContact({ id: contact.id, name: `${contact.firstName} ${contact.lastName}`.trim() }); // Store ID and name
    };

    const handleDeleteCancel = () => {
        setDeletingContact(null); // Close the modal
        setActionError('');
    };

    const handleConfirmDelete = async () => {

        if (!deletingContact) return; // Should not happen, but safety check

        setIsProcessingAction(true);
        setActionError('');
        const contactIdToDelete = deletingContact.id;
        console.log(`Attempting to delete contact ID: ${contactIdToDelete}`);

        try {
            const response = await fetch(`${API_BASE_URL}/${contactIdToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                let errorMsg = `Failed to delete contact: ${response.statusText || response.status}`;
                try {
                    const errorText = await response.text();
                    if (errorText && errorText.trim().startsWith('{')) { const errorData = JSON.parse(errorText); errorMsg = errorData.error || errorMsg; }
                    else if (errorText) { errorMsg = errorText; }
                } catch (e) { /* Ignore parsing errors */ }
                if (response.status === 401 || response.status === 403) throw new Error('Session expired or invalid. Please log in again.');
                throw new Error(errorMsg);
            }
            console.log(`Contact ID: ${contactIdToDelete} deleted successfully.`);
            setDeletingContact(null); // Close modal on success
            // Refresh list logic
            if (contacts.length === 1 && page > 0) { setPage(p => p - 1); } // Go back a page if it was the last item
            else { fetchContacts(page, debouncedSearchTerm); } // Otherwise, refetch current page
        } catch (err) {
            console.error("Error deleting contact:", err);
            setActionError(err.message || 'Could not delete contact.');
            setDeletingContact(null); // Close modal even on error, error is displayed above table
            if (err.message.includes('Session expired')) onLogout();
        } finally {
            setIsProcessingAction(false);
        }
    };
    // ------------------------------------

    return (
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-6 md:p-8 flex flex-col border border-gray-200" style={{ minHeight: '600px' }}>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-gray-200 pb-4 gap-4">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-700">Your Contacts</h2>
                <div className="flex items-center space-x-3 md:space-x-4">
                    <span className="text-sm text-gray-600 hidden sm:inline">Welcome, {username}!</span>
                    <button
                        onClick={onLogout}
                        className="px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-150"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <label htmlFor="search-contacts" className="sr-only">Search Contacts</label>
                <input
                    id="search-contacts"
                    type="search"
                    placeholder="Search by first or last name..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
                />
            </div>

            {/* Action Error Display */}
            {actionError && <p className="mb-3 text-center text-red-500 bg-red-100 p-3 rounded-md border border-red-200">{actionError}</p>}

            {/* Loading/Error State for list */}
            {loadingContacts && (
                <div className="flex justify-center items-center h-40">
                    <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="ml-3 text-gray-500">Loading contacts...</span>
                </div>
            )}
            {contactsError && <p className="text-center text-red-500 bg-red-100 p-3 rounded-md border border-red-200">{contactsError}</p>}


            {/* Contact List Table */}
            {!loadingContacts && !contactsError && (
                <div className="flex-grow overflow-auto mb-4 border border-gray-200 rounded-lg">
                    {contacts.length === 0 ? (
                        <p className="text-center text-gray-500 p-10">
                            {debouncedSearchTerm ? 'No contacts found matching your search.' : 'You have no contacts yet.'}
                        </p>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Title</th>
                                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emails</th>
                                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Phones</th>
                                    <th scope="col" className="relative px-4 sm:px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {contacts.map((contact) => (
                                    <tr key={contact.id} className="hover:bg-gray-50 transition duration-150">
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.firstName} {contact.lastName}</td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{contact.title}</td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-normal text-sm text-gray-500 break-words align-top">
                                            {Array.isArray(contact.emails) && contact.emails.length > 0
                                                ? contact.emails.map(e => <div key={e.id || e.email}><span className="font-medium">{e.label || 'N/A'}:</span> {e.email}</div>)
                                                : 'N/A'}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-normal text-sm text-gray-500 hidden sm:table-cell align-top">
                                            {Array.isArray(contact.phones) && contact.phones.length > 0
                                                ? contact.phones.map(p => <div key={p.id || p.phoneNumber}><span className="font-medium">{p.label || 'N/A'}:</span> {p.phoneNumber}</div>)
                                                : 'N/A'}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-top">
                                            <button
                                                onClick={() => handleEditClick(contact)}
                                                disabled={isProcessingAction}
                                                className="text-indigo-600 hover:text-indigo-900 mr-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(contact)}
                                                disabled={isProcessingAction}
                                                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Pagination */}
            {!loadingContacts && !contactsError && (contacts.length > 0 || page > 0) && (
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <button onClick={handlePrevPage} disabled={page === 0 || loadingContacts} className={`px-4 py-1.5 rounded-md text-sm font-medium transition duration-150 ${page === 0 || loadingContacts ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1'}`}>Previous</button>
                    <span className="text-sm text-gray-600">Page {page + 1}</span>
                    <button onClick={handleNextPage} disabled={isLastPage || loadingContacts} className={`px-4 py-1.5 rounded-md text-sm font-medium transition duration-150 ${isLastPage || loadingContacts ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1'}`}>Next</button>
                </div>
            )}

            {/* Add Contact Button */}
            {!loadingContacts && token && (
                <div className="mt-6 text-center">
                    <button className="px-6 py-2 rounded-md font-semibold bg-green-500 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150">Add New Contact</button>
                </div>
            )}

            {/* Edit Modal */}
            {editingContact && (
                <EditContactModal
                    contact={editingContact}
                    onSave={handleUpdateContact}
                    onCancel={handleModalCancel}
                    token={token}
                />
            )}

            {/* Delete Modal */}
            <DeleteConfirmModal
                isOpen={!!deletingContact} // Open if deletingContact is not null
                onCancel={handleDeleteCancel}
                onConfirm={handleConfirmDelete}
                contactName={deletingContact?.name} // Pass the name to display
                isProcessing={isProcessingAction}
            />
        </div>
    );
}

export default ContactListPage;