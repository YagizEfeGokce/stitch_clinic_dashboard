import { describe, it, expect } from 'vitest';
import { sanitizeTurkishPhone, isValidTurkishPhone, formatPhoneDisplay } from './phone';

describe('Phone Utilities', () => {
    describe('sanitizeTurkishPhone', () => {
        it('should normalize phone with leading 0', () => {
            expect(sanitizeTurkishPhone('0532 123 45 67')).toBe('5321234567');
        });

        it('should normalize phone with +90 prefix', () => {
            expect(sanitizeTurkishPhone('+90 532 123 45 67')).toBe('5321234567');
        });

        it('should normalize phone with 90 prefix (no plus)', () => {
            expect(sanitizeTurkishPhone('90 532 123 45 67')).toBe('5321234567');
        });

        it('should normalize phone without any prefix', () => {
            expect(sanitizeTurkishPhone('532 123 45 67')).toBe('5321234567');
        });

        it('should handle phone with parentheses and dashes', () => {
            expect(sanitizeTurkishPhone('(0532) 123-45-67')).toBe('5321234567');
        });

        it('should handle phone with dots', () => {
            expect(sanitizeTurkishPhone('0532.123.45.67')).toBe('5321234567');
        });

        it('should handle plain 10-digit starting with 5', () => {
            expect(sanitizeTurkishPhone('5321234567')).toBe('5321234567');
        });

        it('should return null for empty input', () => {
            expect(sanitizeTurkishPhone('')).toBeNull();
            expect(sanitizeTurkishPhone(null)).toBeNull();
            expect(sanitizeTurkishPhone(undefined)).toBeNull();
        });

        it('should return null for invalid phone (not starting with 5)', () => {
            expect(sanitizeTurkishPhone('0312 123 45 67')).toBeNull(); // Ankara landline
        });

        it('should return null for phone with wrong digit count', () => {
            expect(sanitizeTurkishPhone('532 123 45')).toBeNull(); // Too short
            expect(sanitizeTurkishPhone('532 123 45 678')).toBeNull(); // Too long
        });
    });

    describe('isValidTurkishPhone', () => {
        it('should return true for valid Turkish mobile', () => {
            expect(isValidTurkishPhone('5321234567')).toBe(true);
            expect(isValidTurkishPhone('0532 123 45 67')).toBe(true);
            expect(isValidTurkishPhone('+90 532 123 45 67')).toBe(true);
        });

        it('should return false for invalid input', () => {
            expect(isValidTurkishPhone('')).toBe(false);
            expect(isValidTurkishPhone(null)).toBe(false);
            expect(isValidTurkishPhone('123')).toBe(false);
            expect(isValidTurkishPhone('0312 123 45 67')).toBe(false); // Landline
        });
    });

    describe('formatPhoneDisplay', () => {
        it('should format 10-digit phone correctly', () => {
            expect(formatPhoneDisplay('5321234567')).toBe('532 123 45 67');
        });

        it('should format partial phone (3 digits)', () => {
            expect(formatPhoneDisplay('532')).toBe('532');
        });

        it('should format partial phone (6 digits)', () => {
            expect(formatPhoneDisplay('532123')).toBe('532 123');
        });

        it('should format partial phone (8 digits)', () => {
            expect(formatPhoneDisplay('53212345')).toBe('532 123 45');
        });

        it('should handle empty input', () => {
            expect(formatPhoneDisplay('')).toBe('');
            expect(formatPhoneDisplay(null)).toBe('');
        });

        it('should strip leading zeros', () => {
            expect(formatPhoneDisplay('0532123')).toBe('532 123');
        });
    });
});
