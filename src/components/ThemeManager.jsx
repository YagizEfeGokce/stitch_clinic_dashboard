import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ThemeManager() {
    useEffect(() => {
        fetchAndApplyTheme();

        // Optional: Subscribe to changes if we want real-time updates across devices
        // For now, simpler fetch is fine.
    }, []);

    const hexToRgb = (hex) => {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function (m, r, g, b) {
            return r + r + g + g + b + b;
        });

        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    const fetchAndApplyTheme = async () => {
        try {
            const { data } = await supabase
                .from('clinic_settings')
                .select('primary_color, secondary_color')
                .single();

            if (data) {
                applyTheme(data);
            }
        } catch (error) {
            console.error('Error applying theme:', error);
        }
    };

    const applyTheme = (settings) => {
        const root = document.documentElement;

        if (settings.primary_color) {
            const rgb = hexToRgb(settings.primary_color);
            if (rgb) {
                root.style.setProperty('--color-primary', `${rgb.r} ${rgb.g} ${rgb.b}`);
                // Simple darkening for primary-dark (reduce brightness by 20%)
                root.style.setProperty('--color-primary-dark', `${Math.max(0, rgb.r - 30)} ${Math.max(0, rgb.g - 30)} ${Math.max(0, rgb.b - 30)}`);
            }
        }

        if (settings.secondary_color) {
            const rgb = hexToRgb(settings.secondary_color);
            if (rgb) {
                root.style.setProperty('--color-secondary', `${rgb.r} ${rgb.g} ${rgb.b}`);
            }
        }
    };

    return null; // This component renders nothing visually
}
