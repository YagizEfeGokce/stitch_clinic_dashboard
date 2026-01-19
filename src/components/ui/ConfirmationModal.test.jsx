import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmationModal from './ConfirmationModal';

describe('ConfirmationModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
        title: 'Silmeyi Onayla',
        message: 'Bu işlem geri alınamaz.',
        confirmText: 'Sil',
        type: 'danger',
        loading: false,
    };

    it('should not render when isOpen is false', () => {
        render(<ConfirmationModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Silmeyi Onayla')).not.toBeInTheDocument();
    });

    it('should render title and message when open', () => {
        render(<ConfirmationModal {...defaultProps} />);
        expect(screen.getByText('Silmeyi Onayla')).toBeInTheDocument();
        expect(screen.getByText('Bu işlem geri alınamaz.')).toBeInTheDocument();
    });

    it('should render confirm button with correct text', () => {
        render(<ConfirmationModal {...defaultProps} />);
        expect(screen.getByText('Sil')).toBeInTheDocument();
    });

    it('should render cancel button', () => {
        render(<ConfirmationModal {...defaultProps} />);
        expect(screen.getByText('İptal')).toBeInTheDocument();
    });

    it('should call onClose when cancel is clicked', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        render(<ConfirmationModal {...defaultProps} onClose={onClose} />);

        await user.click(screen.getByText('İptal'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onConfirm when confirm is clicked', async () => {
        const user = userEvent.setup();
        const onConfirm = vi.fn();
        render(<ConfirmationModal {...defaultProps} onConfirm={onConfirm} />);

        await user.click(screen.getByText('Sil'));
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should disable confirm button when loading', () => {
        render(<ConfirmationModal {...defaultProps} loading={true} />);
        const confirmButton = screen.getByText('Sil').closest('button');
        expect(confirmButton).toBeDisabled();
    });

    it('should show spinner when loading', () => {
        render(<ConfirmationModal {...defaultProps} loading={true} />);
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should apply danger styling for type danger', () => {
        render(<ConfirmationModal {...defaultProps} type="danger" />);
        const confirmButton = screen.getByText('Sil').closest('button');
        expect(confirmButton).toHaveClass('bg-red-500');
    });
});
