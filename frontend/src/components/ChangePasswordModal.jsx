import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon, Spinner } from '../utils/Icons';

const API_BASE_URL = 'http://localhost:8080/api/auth';

function ChangePasswordModal({ token, onSuccess, onCancel, onLogout }) {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!oldPassword || !newPassword || !confirmPassword) {
            setError('All fields are required.');
            return;
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New password and confirmation password do not match.');
            return;
        }

        if (oldPassword === newPassword) {
            setError('New password must be different from the old password.');
            return;
        }

        setIsProcessing(true);

        try {
            const response = await fetch(`${API_BASE_URL}/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ oldPassword, newPassword }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    const message = 'Session expired or unauthorized. Logging out.';
                    onLogout(message);
                    throw new Error(message);
                }
                throw new Error(data.error || 'Password change failed.');
            }

            onSuccess('Password updated successfully!');
        } catch (err) {
            console.error('Password change error:', err);
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-[100] flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm mx-auto p-6 transition-all transform scale-100 opacity-100 border border-indigo-200">
                <h3 className="text-xl font-semibold text-indigo-700 mb-4 border-b pb-2">Change Password</h3>

                {error && (
                    <p className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded-md border border-red-200">{error}</p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="oldPassword">Current Password</label>
                        <div className="relative">
                            <input
                                id="oldPassword"
                                type={showOldPassword ? 'text' : 'password'}
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="w-full p-2 pr-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={isProcessing}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowOldPassword(prev => !prev)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 disabled:opacity-50"
                                disabled={isProcessing}
                                aria-label={showOldPassword ? 'Hide current password' : 'Show current password'}
                            >
                                {showOldPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="newPassword">New Password</label>
                        <div className="relative">
                            <input
                                id="newPassword"
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full p-2 pr-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={isProcessing}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(prev => !prev)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 disabled:opacity-50"
                                disabled={isProcessing}
                                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                            >
                                {showNewPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">Confirm New Password</label>
                        <div className="relative">
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-2 pr-10 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={isProcessing}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(prev => !prev)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 disabled:opacity-50"
                                disabled={isProcessing}
                                aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                            >
                                {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 rounded-md border text-white bg-red-600 hover:bg-red-700 transition duration-150 disabled:opacity-50"
                            disabled={isProcessing}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <Spinner />
                            ) : 'Save Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ChangePasswordModal;