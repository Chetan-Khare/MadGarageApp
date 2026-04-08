import { create } from 'zustand';

interface ThemeState {
    isDark: boolean;
    toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
    isDark: true, // Default is dark
    toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
}));

// ── Centralised palette ──────────────────────────────────────────────────────
export const DARK_THEME = {
    bg: '#121212',
    bg2: '#121212',
    card: '#1A1A1A',
    cardBorder: 'rgba(255, 255, 255, 0.05)',
    inputBg: '#242424',
    inputBorder: 'rgba(255, 255, 255, 0.05)',
    text: '#FFFFFF',
    subText: '#7A7A85',
    placeholder: '#7A7A85',
    statusBar: 'light-content' as const,
    headerBg: '#121212',
    headerBorder: 'rgba(255, 255, 255, 0.05)',
    sectionTitle: '#FFFFFF',
    statBg: '#1A1A1A',
    statBorder: 'rgba(255, 255, 255, 0.05)',
    formBg: '#1A1A1A',
    formBorder: 'rgba(255, 255, 255, 0.05)',
    roleBg: '#242424',
    roleBorder: 'rgba(255, 255, 255, 0.05)',
    inputFieldBg: '#242424',
    inputFieldBorder: 'rgba(255, 255, 255, 0.05)',
    logoutBg: '#220A0A',
    primary: '#DF2324', // GoMechanic Red
};

export const LIGHT_THEME = {
    bg: '#F5F6F8',
    bg2: '#FFFFFF',
    card: '#FFFFFF',
    cardBorder: '#E5E5E5',
    inputBg: '#F9F9F9',
    inputBorder: '#E5E5E5',
    text: '#262626',
    subText: '#8F92A1',
    placeholder: '#8F92A1',
    statusBar: 'dark-content' as const,
    headerBg: '#FFFFFF',
    headerBorder: '#E5E5E5',
    sectionTitle: '#262626',
    statBg: '#FFFFFF',
    statBorder: '#E5E5E5',
    formBg: '#FFFFFF',
    formBorder: '#E5E5E5',
    roleBg: '#F9F9F9',
    roleBorder: '#E5E5E5',
    inputFieldBg: '#F9F9F9',
    inputFieldBorder: '#E5E5E5',
    logoutBg: '#FFF0F0',
    primary: '#DF2324', // GoMechanic Red
};
