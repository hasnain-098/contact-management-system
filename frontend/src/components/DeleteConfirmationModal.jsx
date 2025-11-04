import React from 'react';
import PropTypes from 'prop-types'; 
import { Spinner } from "../utils/Icons";

function DeleteConfirmModal({ isOpen, onCancel, onConfirm, contactName, isProcessing }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
            <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">Confirm Deletion</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Are you sure you want to delete the contact for <span className="font-semibold">{contactName || 'this contact'}</span>? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className={`px-4 py-2 rounded-md text-white font-semibold transition duration-150 flex items-center justify-center ${isProcessing ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1'
                            }`}
                    >
                        {isProcessing && (
                            <Spinner />
                        )}
                        {isProcessing ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}

DeleteConfirmModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    contactName: PropTypes.string,
    isProcessing: PropTypes.bool.isRequired,
};

export default DeleteConfirmModal;