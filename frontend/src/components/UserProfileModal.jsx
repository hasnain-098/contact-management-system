import React, { useState } from 'react';
import { formatDisplayName } from '../utils/formatting';
import { ProfileIcon } from '../utils/Icons';

function UserProfileModal({ username, onLogout, onCancel, onChangePasswordClick }) {
    const [message, setMessage] = useState('');
    const displayName = formatDisplayName(username);

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative mx-auto p-6 border w-full max-w-sm shadow-2xl rounded-xl bg-white transform transition-all duration-300 scale-100 opacity-100">

                <button
                    onClick={onCancel}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
                    aria-label="Close Profile"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>

                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 border-4 border-indigo-300 mb-4">
                        <ProfileIcon className="w-5 h-5" />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 leading-6 mb-1">{displayName}</h3>
                    <p className="text-sm text-gray-500 font-medium truncate mb-6 border-b pb-2">{username}</p>
                </div>

                {message && (
                    <p className={`text-center text-sm p-2 rounded-md mb-4 ${message.includes('placeholder') ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {message}
                    </p>
                )}

                <div className="space-y-3">
                    <button
                        onClick={onChangePasswordClick}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Change Password
                    </button>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3v-4a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg>
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UserProfileModal;
