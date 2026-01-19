import { useState, useCallback } from 'react';
import { useOptimistic } from './useOptimistic';

/**
 * Hook for managing lists with optimistic updates
 * Handles create, update, delete operations with automatic rollback
 * 
 * @param {Array} initialData - Initial list data
 * @returns {Object} List operations and state
 */
export function useOptimisticList(initialData = []) {
    const [items, setItems] = useState(initialData);
    const { optimisticUpdate, isProcessing } = useOptimistic();

    /**
     * Optimistically add item to list
     * @param {Object} newItem - Item to add (without id)
     * @param {Function} operation - API call function (receives newItem)
     * @param {Object} options - Success/error messages and callbacks
     */
    const addItem = useCallback(async (newItem, operation, options = {}) => {
        // Generate temporary ID for optimistic item
        const tempId = `temp_${Date.now()}`;
        const optimisticItem = { ...newItem, id: tempId, _isOptimistic: true };

        return optimisticUpdate({
            // Add to UI immediately
            perform: () => {
                setItems(prev => [optimisticItem, ...prev]);
            },

            // Remove from UI on failure
            rollback: () => {
                setItems(prev => prev.filter(item => item.id !== tempId));
            },

            // Actual API call
            operation: async () => {
                const result = await operation(newItem);
                if (result.data) {
                    // Replace temp item with real item from server
                    setItems(prev => prev.map(item =>
                        item.id === tempId ? { ...result.data, _isOptimistic: false } : item
                    ));
                }
                return result;
            },

            successMessage: options.successMessage || 'Eklendi',
            errorMessage: options.errorMessage,
            onSuccess: options.onSuccess,
            onError: options.onError,
        });
    }, [optimisticUpdate]);

    /**
     * Optimistically update item in list
     * @param {string} id - Item ID to update
     * @param {Object} updates - Fields to update
     * @param {Function} operation - API call function (receives id, updates)
     * @param {Object} options - Success/error messages and callbacks
     */
    const updateItem = useCallback(async (id, updates, operation, options = {}) => {
        // Store old item for rollback
        let oldItem = null;

        return optimisticUpdate({
            // Update in UI immediately
            perform: () => {
                setItems(prev => prev.map(item => {
                    if (item.id === id) {
                        oldItem = { ...item };
                        return { ...item, ...updates, _isOptimistic: true };
                    }
                    return item;
                }));
            },

            // Restore old item on failure
            rollback: () => {
                if (oldItem) {
                    setItems(prev => prev.map(item =>
                        item.id === id ? oldItem : item
                    ));
                }
            },

            // Actual API call
            operation: async () => {
                const result = await operation(id, updates);
                if (result.data) {
                    // Ensure we have the latest data from server
                    setItems(prev => prev.map(item =>
                        item.id === id ? { ...result.data, _isOptimistic: false } : item
                    ));
                }
                return result;
            },

            successMessage: options.successMessage || 'Güncellendi',
            errorMessage: options.errorMessage,
            onSuccess: options.onSuccess,
            onError: options.onError,
        });
    }, [optimisticUpdate]);

    /**
     * Optimistically delete item from list
     * @param {string} id - Item ID to delete
     * @param {Function} operation - API call function (receives id)
     * @param {Object} options - Success/error messages and callbacks
     */
    const deleteItem = useCallback(async (id, operation, options = {}) => {
        // Store deleted item for rollback
        let deletedItem = null;
        let deletedIndex = -1;

        return optimisticUpdate({
            // Remove from UI immediately
            perform: () => {
                setItems(prev => {
                    const index = prev.findIndex(item => item.id === id);
                    if (index !== -1) {
                        deletedItem = prev[index];
                        deletedIndex = index;
                        return prev.filter(item => item.id !== id);
                    }
                    return prev;
                });
            },

            // Restore deleted item on failure (at same position)
            rollback: () => {
                if (deletedItem && deletedIndex !== -1) {
                    setItems(prev => {
                        const newItems = [...prev];
                        newItems.splice(deletedIndex, 0, deletedItem);
                        return newItems;
                    });
                }
            },

            // Actual API call
            operation: () => operation(id),

            successMessage: options.successMessage || 'Silindi',
            errorMessage: options.errorMessage,
            onSuccess: options.onSuccess,
            onError: options.onError,
        });
    }, [optimisticUpdate]);

    return {
        items,
        setItems,
        addItem,
        updateItem,
        deleteItem,
        isProcessing,
    };
}

export default useOptimisticList;
