import { useState, useEffect } from 'react';
import { sanitizeTurkishPhone, formatPhoneDisplay, isValidTurkishPhone as validatePhone } from '../../lib/utils/phone';

/**
 * PhoneInput - Turkish phone number input with formatting
 * 
 * Display format: 532 222 22 22 (with +90 visual prefix)
 * Stored as: 5XXXXXXXXX (10 digits, no prefix)
 */
export default function PhoneInput({ value, onChange, error, disabled }) {
    const [displayValue, setDisplayValue] = useState('');

    // Convert stored value (10-digit) to display format
    useEffect(() => {
        if (value) {
            // Handle both old +90 format and new 10-digit format
            let digits = value;
            if (value.startsWith('+90')) {
                digits = value.slice(3);
            } else if (value.startsWith('90') && value.length > 10) {
                digits = value.slice(2);
            }
            setDisplayValue(formatPhoneDisplay(digits));
        } else {
            setDisplayValue('');
        }
    }, [value]);

    function handleChange(e) {
        const input = e.target.value;
        // Remove leading 0 automatically
        const cleanInput = input.replace(/^0+/, '');
        const formatted = formatPhoneDisplay(cleanInput);
        setDisplayValue(formatted);

        // Extract digits for storage
        const digits = cleanInput.replace(/\D/g, '').slice(0, 10);

        if (digits.length === 10 && digits.startsWith('5')) {
            // Valid complete number - store as 10-digit format
            onChange(digits);
        } else if (digits.length > 0) {
            // Partial number - pass through for validation feedback
            onChange(digits);
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

// Re-export validation helper for backward compatibility
export function isValidTurkishPhone(phone) {
    if (!phone) return false;

    // Handle legacy +90 format for backward compatibility
    if (phone.startsWith('+90')) {
        const digits = phone.slice(3);
        return validatePhone(digits);
    }

    // New 10-digit format
    return validatePhone(phone);
}
