import { describe, it, expect } from 'vitest';
import { getLocalISOString, getReadableDate } from './dateUtils';

describe('Date Utilities', () => {
    describe('getLocalISOString', () => {
        it('should return ISO string format YYYY-MM-DD', () => {
            const result = getLocalISOString();
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        it('should return todays date', () => {
            const result = getLocalISOString();
            const today = new Date();
            const year = today.getFullYear();
            expect(result).toContain(year.toString());
        });

        it('should handle custom date', () => {
            const customDate = new Date('2024-06-15T12:00:00');
            const result = getLocalISOString(customDate);
            expect(result).toBe('2024-06-15');
        });
    });

    describe('getReadableDate', () => {
        it('should return readable Turkish date format', () => {
            const result = getReadableDate();
            expect(result).toContain('Bugün');
        });

        it('should include month and day', () => {
            const result = getReadableDate();
            expect(result).toMatch(/Bugün,.+/);
        });
    });
});
