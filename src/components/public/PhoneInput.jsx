import { useState, useEffect } from 'react';

/**
 * PhoneInput - Turkish phone number input with formatting
 * 
 * Display format: 532 222 22 22 (without leading 0)
 * Stored as: +90xxxxxxxxxx
 */
export default function PhoneInput({ value, onChange, error, disabled }) {
    const [displayValue, setDisplayValue] = useState('');

    // Convert stored value (+90...) to display format (no leading 0)
    useEffect(() => {
        if (value && value.startsWith('+90')) {
            const digits = value.slice(3); // Remove +90
            setDisplayValue(formatPhoneDisplay(digits));
        } else if (value) {
            // Handle if user somehow passed a different format
            const digits = value.replace(/\D/g, '').replace(/^0+/, '');
            setDisplayValue(formatPhoneDisplay(digits));
        }
    }, [value]);

    // Format phone for display: 5xx xxx xx xx (no leading 0)
    function formatPhoneDisplay(input) {
        // Remove all non-digits and any leading zeros
        const digits = input.replace(/\D/g, '').replace(/^0+/, '').slice(0, 10);

        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
        if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
    }

    // Normalize phone for storage: +90xxxxxxxxxx
    function normalizePhone(input) {
        // Remove all non-digits and leading zeros
        const digits = input.replace(/\D/g, '').replace(/^0+/, '');

        if (digits.length === 10) {
            return '+90' + digits;
        }
        // Return partial for validation purposes
        return '+90' + digits.slice(0, 10);
    }

    function handleChange(e) {
        const input = e.target.value;
        // Remove leading 0 automatically
        const cleanInput = input.replace(/^0+/, '');
        const formatted = formatPhoneDisplay(cleanInput);
        setDisplayValue(formatted);

        // Only call onChange if we have a valid-ish number
        const digits = cleanInput.replace(/\D/g, '');
        if (digits.length >= 10) {
            onChange(normalizePhone(cleanInput));
        } else if (digits.length > 0) {
            onChange(normalizePhone(cleanInput)); // Partial for validation
        } else {
            onChange(''); // Clear if empty
        }
    }

    return (
        <div className="relative">
            <div className="flex items-center">
                <span className="absolute left-4 text-slate-400 font-medium select-none pointer-events-none">+90</span>
                <input
                    type="tel"
                    inputMode="numeric"
                    value={displayValue}
                    onChange={handleChange}
                    disabled={disabled}
                    placeholder="532 222 22 22"
                    maxLength={13} // "5xx xxx xx xx" = 13 chars with spaces
                    className={`w-full pl-14 pr-4 py-3 rounded-xl border text-base font-medium transition-all
                        ${error
                            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200'
                            : 'border-slate-200 bg-white focus:border-primary focus:ring-primary/20'
                        }
                        focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400
                    `}
                />
            </div>
            {error && (
                <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>
            )}
        </div>
    );
}

// Export validation helper
export function isValidTurkishPhone(phone) {
    if (!phone) return false;
    // Check normalized format +90xxxxxxxxxx
    if (phone.startsWith('+90') && phone.length === 13) {
        return /^\+90[5][0-9]{9}$/.test(phone);
    }
    return false;
}
