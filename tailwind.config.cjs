/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './index.html',
        './index.tsx',
        './App.tsx',
        './components/**/*.{ts,tsx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: '#10b981',
                    foreground: '#ffffff',
                },
                secondary: {
                    DEFAULT: '#f1f5f9',
                    foreground: '#0f172a',
                },
                destructive: {
                    DEFAULT: '#ef4444',
                    foreground: '#ffffff',
                },
                muted: {
                    DEFAULT: '#f8fafc',
                    foreground: '#64748b',
                },
                accent: {
                    DEFAULT: '#f0fdf4',
                    foreground: '#166534',
                },
            },
        },
    },
    plugins: [],
};
