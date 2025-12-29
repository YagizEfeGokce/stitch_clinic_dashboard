/**
 * Returns a date string in YYYY-MM-DD format using the Local Timezone.
 * Avoids UTC issues where "Today" might be "Yesterday" late at night.
 */
export const getLocalISOString = (date = new Date()) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
};

/**
 * Returns a readable date string (e.g., "Today, Dec 24")
 */
export const getReadableDate = (date = new Date()) => {
    return `Bugün, ${date.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}`;
};
