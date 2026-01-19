/**
 * Centralized API Layer
 * 
 * All Supabase operations should go through these APIs to ensure:
 * - Consistent error handling with Turkish translations
 * - Predictable data fetching patterns
 * - Easy testing and mocking
 * - Single source of truth for data operations
 * 
 * @example
 * // Instead of:
 * const { data, error } = await supabase.from('clients').select('*').eq('clinic_id', clinicId);
 * 
 * // Use:
 * import { clientsAPI } from '@/lib/api';
 * const { data, error } = await clientsAPI.getClients(clinicId);
 */

export { clientsAPI } from './clients';
export { appointmentsAPI } from './appointments';
export { servicesAPI } from './services';
export { inventoryAPI } from './inventory';
export { transactionsAPI } from './transactions';
export { clinicsAPI, staffAPI } from './clinics';
export { reviewsAPI } from './reviews';

// Re-export BaseAPI for custom extensions
export { default as BaseAPI } from './baseClient';
