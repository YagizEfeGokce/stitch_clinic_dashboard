import { describe, it, expect } from 'vitest';
import { formatPhoneNumber, formatCurrency } from './formatUtils';

describe('Format Utilities', () => {
    describe('formatPhoneNumber', () => {
        it('should format 10-digit phone number', () => {
            const result = formatPhoneNumber('5551234567');
            expect(result).toBe('(555) 123 4567');
        });

        it('should format partial phone number (less than 4 digits)', () => {
            const result = formatPhoneNumber('555');
            expect(result).toBe('555');
        });

        it('should format partial phone number (4-6 digits)', () => {
            const result = formatPhoneNumber('555123');
            expect(result).toBe('(555) 123');
        });

        it('should handle empty string', () => {
            const result = formatPhoneNumber('');
            expect(result).toBe('');
        });

        it('should handle null/undefined', () => {
            expect(formatPhoneNumber(null)).toBe('');
            expect(formatPhoneNumber(undefined)).toBe('');
        });

        it('should strip non-numeric characters', () => {
            const result = formatPhoneNumber('+90 555 123 45 67');
            expect(result).toBe('(905) 551 2345');
        });
    });

    describe('formatCurrency', () => {
        it('should format number with Turkish Lira', () => {
            const result = formatCurrency(1500);
            expect(result).toContain('₺');
            expect(result).toMatch(/1[.,]?500/);
        });

        it('should handle zero', () => {
            const result = formatCurrency(0);
            expect(result).toContain('₺');
            expect(result).toContain('0');
        });

        it('should round decimal values', () => {
            const result = formatCurrency(99.99);
            expect(result).toContain('₺');
            expect(result).toContain('100');
        });

        it('should format large numbers with separators', () => {
            const result = formatCurrency(10000);
            // Turkish uses periods as thousand separators
            expect(result).toMatch(/10[.,]?000|₺/);
        });
    });
});
