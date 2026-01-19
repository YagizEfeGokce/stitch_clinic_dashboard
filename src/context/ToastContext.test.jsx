import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToastProvider, { useToast } from './ToastContext';

// Test component to trigger toasts
function TestComponent() {
    const { success, error: showError } = useToast();

    return (
        <div>
            <button onClick={() => success('Başarıyla kaydedildi')}>Show Success</button>
            <button onClick={() => showError('Bir hata oluştu')}>Show Error</button>
        </div>
    );
}

describe('Toast Context', () => {
    it('should provide toast functions to children', () => {
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        expect(screen.getByText('Show Success')).toBeInTheDocument();
        expect(screen.getByText('Show Error')).toBeInTheDocument();
    });

    it('should show success toast when triggered', async () => {
        const user = userEvent.setup();

        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        await user.click(screen.getByText('Show Success'));

        await waitFor(() => {
            expect(screen.getByText('Başarıyla kaydedildi')).toBeInTheDocument();
        });
    });

    it('should show error toast when triggered', async () => {
        const user = userEvent.setup();

        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        await user.click(screen.getByText('Show Error'));

        await waitFor(() => {
            expect(screen.getByText('Bir hata oluştu')).toBeInTheDocument();
        });
    });
});
