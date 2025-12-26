/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    // darkMode removed
    theme: {
        extend: {
            colors: {
                "primary": "rgb(var(--color-primary) / <alpha-value>)",
                "primary-dark": "rgb(var(--color-primary-dark) / <alpha-value>)",
                "secondary": "rgb(var(--color-secondary) / <alpha-value>)",
                "accent": "#e0bfb8", // Rose Gold-ish
                "background-light": "rgb(var(--color-background-light) / <alpha-value>)",
                "surface": "rgb(var(--color-surface) / <alpha-value>)",
                "slate": {
                    50: '#f8fafc',
                    100: 'rgb(var(--color-border) / <alpha-value>)',  // Map slate-100 to border for seamless dark mode borders
                    // We can keep others standard
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: 'rgb(var(--color-text-main) / <alpha-value>)', // Map slate-900 to main text for auto dark mode text
                    950: '#020617',
                }
            },
            fontFamily: {
                "display": ["Manrope", "sans-serif"]
            },
            borderRadius: {
                "lg": "1rem",
                "xl": "1.5rem",
                "2xl": "2rem",
                "3xl": "2.5rem",
            },
            boxShadow: {
                "float": "0 10px 40px -10px rgba(13, 148, 136, 0.1)",
                "card": "0 4px 20px -2px rgba(0, 0, 0, 0.05)"
            }
        },
    },
    plugins: [],
}
