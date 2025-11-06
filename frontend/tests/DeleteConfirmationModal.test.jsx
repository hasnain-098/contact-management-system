import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeleteConfirmModal from '../src/components/DeleteConfirmationModal';

jest.mock('../src/utils/Icons', () => ({
    Spinner: (props) => <div data-testid="spinner" {...props} />,
}));

const mockProps = {
    isOpen: true,
    onCancel: jest.fn(),
    onConfirm: jest.fn(),
    contactName: 'John Doe',
    isProcessing: false,
};

const setup = (props = {}) => {
    const combinedProps = { ...mockProps, ...props };

    const { rerender } = render(<DeleteConfirmModal {...combinedProps} />);
    return { 
        rerender,
        updateProps: (newProps) => {
            rerender(<DeleteConfirmModal {...combinedProps} {...newProps} />);
        }
    };
};

describe('DeleteConfirmModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render null if isOpen is false', () => {
        const { container } = render(<DeleteConfirmModal {...mockProps} isOpen={false} />);

        expect(container.firstChild).toBeNull();
    });

    it('should render the modal when isOpen is true', () => {
        setup();
        expect(screen.getByRole('heading', { name: /Confirm Deletion/i })).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
    });

    it('should display the contactName when provided', () => {
        setup();

        expect(screen.getByText(mockProps.contactName, { exact: false })).toBeInTheDocument();
        expect(screen.queryByText(/this contact/i)).not.toBeInTheDocument();
    });

    it('should display fallback text if contactName is not provided', () => {
        setup({ contactName: null });

        expect(screen.getByText(/this contact/i)).toBeInTheDocument();
        expect(screen.queryByText(mockProps.contactName)).not.toBeInTheDocument();
    });

    it('should call onCancel when the Cancel button is clicked', () => {
        setup();
        const cancelButton = screen.getByRole('button', { name: /Cancel/i });
        
        fireEvent.click(cancelButton);
        
        expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
        expect(mockProps.onConfirm).not.toHaveBeenCalled();
    });

    it('should call onConfirm when the "Confirm Delete" button is clicked', () => {
        setup();
        const confirmButton = screen.getByRole('button', { name: /Confirm Delete/i });
        
        fireEvent.click(confirmButton);
        
        expect(mockProps.onConfirm).toHaveBeenCalledTimes(1);
        expect(mockProps.onCancel).not.toHaveBeenCalled();
    });

    it('should show correct text and enable buttons when isProcessing is false', () => {
        setup({ isProcessing: false });
        
        const cancelButton = screen.getByRole('button', { name: /Cancel/i });
        const confirmButton = screen.getByRole('button', { name: /Confirm Delete/i });

        expect(cancelButton).toBeEnabled();
        expect(confirmButton).toBeEnabled();
        expect(confirmButton).toHaveTextContent('Confirm Delete');
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
    });

    it('should show "Deleting..." text, disable buttons, and show spinner when isProcessing is true', () => {
        setup({ isProcessing: true });
        
        const cancelButton = screen.getByRole('button', { name: /Cancel/i });
        const confirmButton = screen.getByRole('button', { name: /Deleting.../i });

        expect(cancelButton).toBeDisabled();
        expect(confirmButton).toBeDisabled();
        expect(confirmButton).toHaveTextContent('Deleting...');
        expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('should update state correctly when props change (e.g., isProcessing changes)', () => {
        const { updateProps } = setup({ isProcessing: false });
        const confirmButton = screen.getByRole('button', { name: /Confirm Delete/i });

        expect(confirmButton).toBeEnabled();
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();

        updateProps({ isProcessing: true });
        
        const deletingButton = screen.getByRole('button', { name: /Deleting.../i });
   
        expect(deletingButton).toBeDisabled();
        expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });
});