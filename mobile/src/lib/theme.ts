import { useColorScheme } from 'react-native';

// Same brand as the web app: orange-700 on light, orange-500 on dark (both pass WCAG AA with their text colour).
const light = {
    background: '#FFFFFF',
    surface: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    text: '#0F172A',
    muted: '#64748B',
    primary: '#C2410C',
    onPrimary: '#FFFFFF',
    accent: '#FFF7ED',
    onAccent: '#9A3412',
    danger: '#DC2626',
};

const dark: typeof light = {
    background: '#020617',
    surface: '#0B1120',
    card: '#0F172A',
    border: '#1E293B',
    text: '#F8FAFC',
    muted: '#94A3B8',
    primary: '#F97316',
    onPrimary: '#0F172A',
    accent: '#1E293B',
    onAccent: '#FDBA74',
    danger: '#F87171',
};

export type Colors = typeof light;

export function useColors(): Colors {
    return useColorScheme() === 'dark' ? dark : light;
}

export const radius = { sm: 8, md: 12, lg: 16, xl: 24 };
export const space = (n: number) => n * 4;
