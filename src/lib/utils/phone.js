/**
 * Turkish Phone Number Utilities
 * 
 * Sanitization and validation for Turkish mobile phone numbers.
 * Storage format: 10 digits starting with 5 (e.g., "5321234567")
 */

/**
 * Sanitize Turkish phone number to 10-digit format.
 * 
 * Accepts multiple input formats and normalizes them:
 * - "0532 123 45 67" → "5321234567"
 * - "+90 532 123 45 67" → "5321234567"
 * - "532 123 45 67" → "5321234567"
 * - "(0532) 123-45-67" → "5321234567"
 * 
 * @param {string} input - Raw phone input
 * @returns {string|null} - 10-digit format "5XXXXXXXXX" or null if invalid
 */
export function sanitizeTurkishPhone(input) {
    if (!input) return null;

    // Strip all non-numeric characters
    let digits = input.replace(/\D/g, '');

    // Remove country code 90 if present (handles both +90 and 90 prefix)
    if (digits.startsWith('90') && digits.length > 10) {
        digits = digits.slice(2);
    }

    // Remove leading 0 if present
    if (digits.startsWith('0')) {
        digits = digits.slice(1);
    }

    // Must be exactly 10 digits starting with 5 (Turkish mobile)
    if (digits.length === 10 && digits.startsWith('5')) {
        return digits;
    }

    return null;
}

/**
 * Validate if a phone string is a valid Turkish mobile number.
 * 
 * @param {string} phone - Phone number in any format
 * @returns {boolean} - True if valid Turkish mobile number
 */
export function isValidTurkishPhone(phone) {
    if (!phone) return false;
    const sanitized = sanitizeTurkishPhone(phone);
    return sanitized !== null && /^5[0-9]{9}$/.test(sanitized);
}

/**
 * Format a 10-digit phone for display with spaces.
 * 
 * @param {string} phone - 10-digit phone (5XXXXXXXXX)
 * @returns {string} - Formatted display "5XX XXX XX XX"
 */
export function formatPhoneDisplay(phone) {
    if (!phone) return '';

    // Clean input and limit to 10 digits
    const digits = phone.replace(/\D/g, '').replace(/^0+/, '').slice(0, 10);

    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
}
