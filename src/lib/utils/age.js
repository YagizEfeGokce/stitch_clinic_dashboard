/**
 * Age Calculation Utilities
 * 
 * Calculate age from birth date for client profiles.
 */

/**
 * Calculate age in years from a birth date.
 * 
 * @param {string|Date} birthDate - Birth date (ISO string or Date object)
 * @returns {number|null} - Age in years, or null if invalid
 */
export function calculateAge(birthDate) {
    if (!birthDate) return null;

    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    // Adjust if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age >= 0 ? age : null;
}

/**
 * Format age with Turkish label.
 * 
 * @param {string|Date} birthDate - Birth date
 * @returns {string} - Formatted age string (e.g., "32 yaşında") or empty string
 */
export function formatAge(birthDate) {
    const age = calculateAge(birthDate);
    if (age === null) return '';
    return `${age} yaşında`;
}
