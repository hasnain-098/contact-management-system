import React, { useState } from 'react';

const API_BASE_URL = 'http://localhost:8080/api/contacts';

const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhoneNumber = (phone) => {
    return /^(?:\+92-\d{3}-\d{7}|03\d{9})$/.test(phone);
};

function CreateContactModal({ token, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        title: '',
        emails: [{ label: '', email: '' }],
        phones: [{ label: '', phoneNumber: '' }],
    });
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

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
        setError('');
        setFormData(prev => ({
            ...prev,
            [type]: [...prev[type],
            type === 'emails'
                ? { label: '', email: '' }
                : { label: '', phoneNumber: '' }
            ]
        }));
    };

    const handleRemoveItem = (type, index) => {
        setError('');
        setFormData(prev => {
            const currentArray = prev[type];
            if (currentArray.length <= 1) {
                setError(`At least one ${type === 'emails' ? 'email' : 'phone number'} is required.`);
                return prev;
            }
            return { ...prev, [type]: currentArray.filter((_, i) => i !== index) };
        });
    };

    const validateForm = (data) => {
        if (!data.firstName) {
            return 'First Name is required.';
        }

        const validEmails = data.emails.filter(e => e.email.trim());
        const validPhones = data.phones.filter(p => p.phoneNumber.trim());

        if (validEmails.length === 0 && validPhones.length === 0) {
            return 'You must provide at least one email or one phone number.';
        }

        if (validEmails.some(e => !isValidEmail(e.email))) {
            return 'One or more email addresses are invalid.';
        }

        if (validPhones.some(p => !isValidPhoneNumber(p.phoneNumber))) {
            return 'One or more phone numbers are invalid (must be at least 6 characters).';
        }

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const validationError = validateForm(formData);
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsProcessing(true);

        const payload = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            title: formData.title || '',
            emails: formData.emails
                .filter(e => e.email.trim() !== '')
                .map(e => ({ label: e.label || 'N/A', email: e.email })),
            phones: formData.phones
                .filter(p => p.phoneNumber.trim() !== '')
                .map(p => ({ label: p.label || 'N/A', phoneNumber: p.phoneNumber })),
        };

        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.error || `Failed to create contact: ${response.statusText || response.status}`);
            }

            console.log("Creation successful:", data);
            onSave(data);
        } catch (err) {
            console.error('Create contact error:', err);
            setError(err.message || 'An error occurred while creating the contact.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
            <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white flex flex-col max-h-[90vh]">
                <h3 className="text-xl font-semibold leading-6 text-gray-900 mb-4 border-b pb-2">Create New Contact</h3>
                {error && <p className="text-red-500 text-sm mb-3 bg-red-100 p-2 rounded-md border border-red-200">{error}</p>}

                <div className="flex-grow overflow-y-auto pr-2 pb-4">
                    <form id="create-contact-form" onSubmit={handleSubmit} className="space-y-3">

                        <div>
                            <label htmlFor="create-firstName" className="text-sm font-medium text-gray-700">First Name *</label>
                            <input type="text" id="create-firstName" name="firstName" value={formData.firstName || ''} onChange={handleChange} required className="mt-1 w-full input-style" disabled={isProcessing} />
                        </div>
                        <div>
                            <label htmlFor="create-lastName" className="text-sm font-medium text-gray-700">Last Name</label>
                            <input type="text" id="create-lastName" name="lastName" value={formData.lastName || ''} onChange={handleChange} className="mt-1 w-full input-style" disabled={isProcessing} />
                        </div>
                        <div>
                            <label htmlFor="create-title" className="text-sm font-medium text-gray-700">Title</label>
                            <input type="text" id="create-title" name="title" value={formData.title || ''} onChange={handleChange} className="mt-1 w-full input-style" disabled={isProcessing} />
                        </div>

                        <fieldset className="border p-3 rounded-md space-y-2">
                            <legend className="text-sm font-medium text-gray-700 px-1">Emails *</legend>
                            {formData.emails?.map((emailItem, index) => (
                                <div key={index} className="grid grid-cols-6 gap-2 items-end">
                                    <div className="col-span-2">
                                        <label htmlFor={`create-email-label-${index}`} className="text-xs font-medium text-gray-600">Label</label>
                                        <input
                                            type="text"
                                            id={`create-email-label-${index}`}
                                            value={emailItem.label || ''}
                                            onChange={(e) => handleNestedChange(e, 'emails', index, 'label')}
                                            className="mt-1 w-full input-style-sm"
                                            placeholder="e.g., Work"
                                            disabled={isProcessing}
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <label htmlFor={`create-email-value-${index}`} className="text-xs font-medium text-gray-600">Email Address</label>
                                        <input
                                            type="email"
                                            id={`create-email-value-${index}`}
                                            value={emailItem.email || ''}
                                            onChange={(e) => handleNestedChange(e, 'emails', index, 'email')}
                                            className="mt-1 w-full input-style-sm"
                                            placeholder="name@example.com"
                                            disabled={isProcessing}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        {formData.emails.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem('emails', index)}
                                                className="px-2 py-1.5 text-xs text-red-600 hover:text-red-800 focus:outline-none disabled:opacity-50"
                                                aria-label={`Remove email ${index + 1}`}
                                                disabled={isProcessing}
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
                                className="mt-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1 transition duration-150 disabled:opacity-50"
                                disabled={isProcessing}
                            >
                                + Add Email
                            </button>
                        </fieldset>

                        <fieldset className="border p-3 rounded-md space-y-2">
                            <legend className="text-sm font-medium text-gray-700 px-1">Phone Numbers *</legend>
                            {formData.phones?.map((phoneItem, index) => (
                                <div key={index} className="grid grid-cols-6 gap-2 items-end">
                                    <div className="col-span-2">
                                        <label htmlFor={`create-phone-label-${index}`} className="text-xs font-medium text-gray-600">Label</label>
                                        <input
                                            type="text"
                                            id={`create-phone-label-${index}`}
                                            value={phoneItem.label || ''}
                                            onChange={(e) => handleNestedChange(e, 'phones', index, 'label')}
                                            className="mt-1 w-full input-style-sm"
                                            placeholder="e.g., Mobile"
                                            disabled={isProcessing}
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <label htmlFor={`create-phone-value-${index}`} className="text-xs font-medium text-gray-600">Phone Number</label>
                                        <input
                                            type="tel"
                                            id={`create-phone-value-${index}`}
                                            value={phoneItem.phoneNumber || ''}
                                            onChange={(e) => handleNestedChange(e, 'phones', index, 'phoneNumber')}
                                            className="mt-1 w-full input-style-sm"
                                            placeholder="+92..."
                                            disabled={isProcessing}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        {formData.phones.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem('phones', index)}
                                                className="px-2 py-1.5 text-xs text-red-600 hover:text-red-800 focus:outline-none disabled:opacity-50"
                                                aria-label={`Remove phone ${index + 1}`}
                                                disabled={isProcessing}
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
                                className="mt-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1 transition duration-150 disabled:opacity-50"
                                disabled={isProcessing}
                            >
                                + Add Phone
                            </button>
                        </fieldset>
                    </form>
                </div>

                <div className="flex-shrink-0 pt-4 flex justify-end space-x-3 border-t mt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="create-contact-form"
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Creating...' : 'Create Contact'}
                    </button>
                </div>
            </div>

            <style>{`
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

export default CreateContactModal;