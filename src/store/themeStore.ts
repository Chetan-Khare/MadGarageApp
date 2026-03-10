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
    bg: '#0A0A0A',
    bg2: '#050505',
    card: '#111111',
    cardBorder: '#1E1E1E',
    inputBg: '#161616',
    inputBorder: '#252525',
    text: '#FFFFFF',
    subText: '#888888',
    placeholder: '#555555',
    statusBar: 'light-content' as const,
    headerBg: '#111111',
    headerBorder: '#FF333333',
    sectionTitle: '#FFFFFF',
    statBg: '#111111',
    statBorder: '#FF333333',
    formBg: '#111111',
    formBorder: '#333333',
    roleBg: '#050505',
    roleBorder: '#333333',
    inputFieldBg: '#050505',
    inputFieldBorder: '#333333',
    logoutBg: '#220A0A',
};

export const LIGHT_THEME = {
    bg: '#F0F4FF',
    bg2: '#FFFFFF',
    card: '#FFFFFF',
    cardBorder: '#E0E0E0',
    inputBg: '#F5F5F5',
    inputBorder: '#DDDDDD',
    text: '#1A1A1A',
    subText: '#888888',
    placeholder: '#AAAAAA',
    statusBar: 'dark-content' as const,
    headerBg: '#FFFFFF',
    headerBorder: '#EEEEEE',
    sectionTitle: '#1A1A1A',
    statBg: '#FFFFFF',
    statBorder: '#EEEEEE',
    formBg: '#FFFFFF',
    formBorder: '#DDDDDD',
    roleBg: '#F5F5F5',
    roleBorder: '#DDDDDD',
    inputFieldBg: '#F5F5F5',
    inputFieldBorder: '#DDDDDD',
    logoutBg: '#FFF0F0',
};
