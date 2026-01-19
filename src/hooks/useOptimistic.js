import { useState, useCallback } from 'react';
import { useToast } from '../context/ToastContext';

/**
 * Hook for optimistic UI updates with automatic rollback
 * 
 * @example
 * const { optimisticUpdate, isProcessing } = useOptimistic();
 * 
 * await optimisticUpdate({
 *   perform: () => updateUI(newData),
 *   rollback: () => updateUI(oldData),
 *   operation: () => api.update(id, newData),
 *   successMessage: 'Güncellendi',
 *   errorMessage: 'Güncelleme başarısız',
 * });
 */
export function useOptimistic() {
    const { success, error: showError } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const optimisticUpdate = useCallback(async ({
        perform,           // Function to update UI immediately
        rollback,          // Function to revert UI on failure
        operation,         // Async function that performs the actual operation
        successMessage,    // Toast message on success
        errorMessage,      // Toast message on failure
        onSuccess,         // Optional callback on success
        onError,           // Optional callback on error
    }) => {
        setIsProcessing(true);

        // Step 1: Optimistically update UI immediately
        try {
            perform();
        } catch (err) {
            console.error('Optimistic update perform failed:', err);
        }

        // Step 2: Perform actual operation
        try {
            const result = await operation();

            // Check if operation failed (API layer returns { data, error })
            if (result?.error) {
                throw new Error(result.error);
            }

            // Step 3: Show success message
            if (successMessage) {
                success(successMessage);
            }

            // Step 4: Call success callback
            if (onSuccess) {
                onSuccess(result);
            }

            setIsProcessing(false);
            return { success: true, data: result?.data };

        } catch (err) {
            // Step 5: Rollback UI on failure
            console.error('Operation failed, rolling back:', err);

            try {
                rollback();
            } catch (rollbackErr) {
                console.error('Rollback failed:', rollbackErr);
            }

            // Step 6: Show error message
            const message = errorMessage || err.message || 'İşlem başarısız';
            showError(message);

            // Step 7: Call error callback
            if (onError) {
                onError(err);
            }

            setIsProcessing(false);
            return { success: false, error: err };
        }
    }, [success, showError]);

    return { optimisticUpdate, isProcessing };
}

export default useOptimistic;
