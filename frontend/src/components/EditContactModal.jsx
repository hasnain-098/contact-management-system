import React, { useState, useEffect } from "react";

const API_BASE_URL = 'http://localhost:8080/api/contacts';

function EditContactModal({ contact, onSave, onCancel, token }) {

    const [formData, setFormData] = useState({
        ...contact,
        emails: Array.isArray(contact?.emails) && contact.emails.length > 0 ? [...contact.emails] : [{ id: null, label: '', email: '' }],
        phones: Array.isArray(contact?.phones) && contact.phones.length > 0 ? [...contact.phones] : [{ id: null, label: '', phoneNumber: '' }],
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setFormData({
            ...contact,
            emails: Array.isArray(contact?.emails) && contact.emails.length > 0 ? [...contact.emails] : [{ id: null, label: '', email: '' }],
            phones: Array.isArray(contact?.phones) && contact.phones.length > 0 ? [...contact.phones] : [{ id: null, label: '', phoneNumber: '' }],
        });
        setError('');
    }, [contact]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNestedChange = (e, type, index, field) => {
        const { value } = e.target;
        setFormData(prev => {
            const updatedArray = prev[type].map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            );
            return { ...prev, [type]: updatedArray };
        });
    };

    const handleAddItem = (type) => {
        setFormData(prev => ({
            ...prev,
            [type]: [...prev[type], type === 'emails' ? { id: null, label: '', email: '' } : { id: null, label: '', phoneNumber: '' }]
        }));
    };

    const handleRemoveItem = (type, index) => {
        if (formData[type].length <= 1) {
            setError(`At least one ${type === 'emails' ? 'email' : 'phone number'} is required.`);
            return;
        }
        setError('');
        setFormData(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        console.log("Saving changes for contact:", formData.id, formData);

        const validEmails = formData.emails.filter(e => e.email && e.email.trim() !== '');
        const validPhones = formData.phones.filter(p => p.phoneNumber && p.phoneNumber.trim() !== '');

        if (!formData.firstName || !formData.title || validEmails.length === 0 || validPhones.length === 0) {
            setError('First Name, Title, at least one valid Email, and at least one valid Phone are required.');
            setIsSaving(false);
            return;
        }

        const emailsToSend = validEmails.map(e => ({ label: e.label || '', email: e.email }));
        const phonesToSend = validPhones.map(p => ({ label: p.label || '', phoneNumber: p.phoneNumber }));


        try {
            const response = await fetch(`${API_BASE_URL}/${formData.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName || '',
                    title: formData.title,
                    emails: emailsToSend,
                    phones: phonesToSend,
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.error || `Failed to update contact: ${response.statusText || response.status}`);
            }

            console.log("Update successful:", data);
            onSave(data);

        } catch (err) {
            console.error("Error updating contact:", err);
            setError(err.message || 'Could not save changes.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!contact) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
            <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Edit Contact</h3>
                {error && <p className="text-red-500 text-sm mb-3 bg-red-100 p-2 rounded-md border border-red-200">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                    <div>
                        <label htmlFor="edit-firstName" className="text-sm font-medium text-gray-700">First Name *</label>
                        <input type="text" id="edit-firstName" name="firstName" value={formData.firstName || ''} onChange={handleChange} required className="mt-1 w-full input-style" />
                    </div>
                    <div>
                        <label htmlFor="edit-lastName" className="text-sm font-medium text-gray-700">Last Name</label>
                        <input type="text" id="edit-lastName" name="lastName" value={formData.lastName || ''} onChange={handleChange} className="mt-1 w-full input-style" />
                    </div>
                    <div>
                        <label htmlFor="edit-title" className="text-sm font-medium text-gray-700">Title *</label>
                        <input type="text" id="edit-title" name="title" value={formData.title || ''} onChange={handleChange} required className="mt-1 w-full input-style" />
                    </div>

                    <fieldset className="border p-3 rounded-md space-y-2">
                        <legend className="text-sm font-medium text-gray-700 px-1">Emails *</legend>
                        {formData.emails?.map((emailItem, index) => (
                            <div key={index} className="grid grid-cols-6 gap-2 items-end">
                                <div className="col-span-2">
                                    <label htmlFor={`edit-email-label-${index}`} className="text-xs font-medium text-gray-600">Label</label>
                                    <input
                                        type="text"
                                        id={`edit-email-label-${index}`}
                                        value={emailItem.label || ''}
                                        onChange={(e) => handleNestedChange(e, 'emails', index, 'label')}
                                        className="mt-1 w-full input-style-sm"
                                        placeholder="e.g., Work"
                                    />
                                </div>
                                <div className="col-span-3">
                                    <label htmlFor={`edit-email-value-${index}`} className="text-xs font-medium text-gray-600">Email Address</label>
                                    <input
                                        type="email"
                                        id={`edit-email-value-${index}`}
                                        value={emailItem.email || ''}
                                        onChange={(e) => handleNestedChange(e, 'emails', index, 'email')}
                                        className="mt-1 w-full input-style-sm"
                                        placeholder="name@example.com"
                                        required={index === 0}
                                    />
                                </div>
                                <div className="col-span-1">
                                    {formData.emails.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem('emails', index)}
                                            className="px-2 py-1.5 text-xs text-red-600 hover:text-red-800 focus:outline-none"
                                            aria-label={`Remove email ${index + 1}`}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => handleAddItem('emails')}
                            className="mt-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1"
                        >
                            + Add Email
                        </button>
                    </fieldset>

                    <fieldset className="border p-3 rounded-md space-y-2">
                        <legend className="text-sm font-medium text-gray-700 px-1">Phone Numbers *</legend>
                        {formData.phones?.map((phoneItem, index) => (
                            <div key={index} className="grid grid-cols-6 gap-2 items-end">
                                <div className="col-span-2">
                                    <label htmlFor={`edit-phone-label-${index}`} className="text-xs font-medium text-gray-600">Label</label>
                                    <input
                                        type="text"
                                        id={`edit-phone-label-${index}`}
                                        value={phoneItem.label || ''}
                                        onChange={(e) => handleNestedChange(e, 'phones', index, 'label')}
                                        className="mt-1 w-full input-style-sm"
                                        placeholder="e.g., Mobile"
                                    />
                                </div>
                                <div className="col-span-3">
                                    <label htmlFor={`edit-phone-value-${index}`} className="text-xs font-medium text-gray-600">Phone Number</label>
                                    <input
                                        type="tel"
                                        id={`edit-phone-value-${index}`}
                                        value={phoneItem.phoneNumber || ''}
                                        onChange={(e) => handleNestedChange(e, 'phones', index, 'phoneNumber')}
                                        className="mt-1 w-full input-style-sm"
                                        placeholder="+92..."
                                        required={index === 0}
                                    />
                                </div>
                                <div className="col-span-1">
                                    {formData.phones.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem('phones', index)}
                                            className="px-2 py-1.5 text-xs text-red-600 hover:text-red-800 focus:outline-none"
                                            aria-label={`Remove phone ${index + 1}`}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => handleAddItem('phones')}
                            className="mt-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1"
                        >
                            + Add Phone
                        </button>
                    </fieldset>

                    <div className="pt-4 flex justify-end space-x-2 border-t mt-4">
                        <button type="button" onClick={onCancel} disabled={isSaving} className="... px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1">Cancel</button>
                        <button type="submit" disabled={isSaving} className="... px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1">
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
            <style jsx>{`
                .input-style {
                    margin-top: 0.25rem;
                    width: 100%;
                    padding-left: 0.75rem;
                    padding-right: 0.75rem;
                    padding-top: 0.5rem;
                    padding-bottom: 0.5rem;
                    border-width: 1px;
                    border-color: #D1D5DB; /* gray-300 */
                    border-radius: 0.375rem; /* rounded-md */
                    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); /* shadow-sm */
                }
                .input-style:focus {
                    outline: 2px solid transparent;
                    outline-offset: 2px;
                    --tw-ring-color: #6366F1; /* ring-indigo-500 */
                    box-shadow: 0 0 0 2px var(--tw-ring-color);
                     border-color: #6366F1; /* border-indigo-500 */
                }
                 .input-style-sm { /* Slightly smaller padding for nested inputs */
                    margin-top: 0.25rem;
                    width: 100%;
                    padding-left: 0.5rem;
                    padding-right: 0.5rem;
                    padding-top: 0.25rem;
                    padding-bottom: 0.25rem;
                    border-width: 1px;
                    border-color: #D1D5DB; /* gray-300 */
                    border-radius: 0.375rem; /* rounded-md */
                    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); /* shadow-sm */
                    font-size: 0.875rem; /* sm:text-sm */
                 }
                 .input-style-sm:focus {
                     outline: 2px solid transparent;
                    outline-offset: 2px;
                    --tw-ring-color: #6366F1; /* ring-indigo-500 */
                    box-shadow: 0 0 0 2px var(--tw-ring-color);
                     border-color: #6366F1; /* border-indigo-500 */
                 }
            `}</style>
        </div>
    );
}

export default EditContactModal;