import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ToastProvider from '../context/ToastContext';

/**
 * Custom render with essential providers for testing
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 */
export function renderWithProviders(ui, options = {}) {
    const { ...renderOptions } = options;

    function Wrapper({ children }) {
        return (
            <BrowserRouter>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </BrowserRouter>
        );
    }

    return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock authenticated user data
export const mockUser = {
    id: 'user-123',
    email: 'test@dermdesk.com',
    full_name: 'Test User',
};

export const mockProfile = {
    id: 'user-123',
    clinic_id: 'clinic-123',
    full_name: 'Test User',
    role: 'owner',
};

export const mockClinic = {
    id: 'clinic-123',
    name: 'Test Clinic',
    subscription_status: 'active',
};

// Mock client data
export const mockClient = {
    id: 'client-123',
    clinic_id: 'clinic-123',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '5551234567',
    created_at: '2024-01-01T00:00:00Z',
};

// Mock appointment data
export const mockAppointment = {
    id: 'apt-123',
    client_id: 'client-123',
    service_id: 'service-123',
    date: '2024-01-15',
    time: '10:00:00',
    status: 'Scheduled',
};

// Mock service data
export const mockService = {
    id: 'service-123',
    name: 'Botox',
    duration: 60,
    price: 500,
    category: 'Injectables',
};

// Re-export everything from RTL
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
