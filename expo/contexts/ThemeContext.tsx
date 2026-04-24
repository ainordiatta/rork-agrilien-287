import createContextHook from '@nkzw/create-context-hook';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Appearance } from 'react-native';
import { loadFromStorage, saveToStorage } from '@/lib/storage';

const STORAGE_KEY = '@app/theme';

// Palette claire
export const lightColors = {
  primary: '#1B6B2A',
  primaryDark: '#145221',
  primaryLight: '#2E8B3E',
  secondary: '#E8611A',
  secondaryLight: '#F0823E',
  orange: '#E8611A',
  orangeLight: '#F0A060',
  green: '#1B6B2A',
  greenLight: '#2E8B3E',
  magenta: '#E8611A',
  purple: '#1B6B2A',
  pink: '#E8611A',
  success: '#2E8B3E',
  warning: '#FFD23F',
  error: '#EF476F',
  background: '#F7F9FC',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  tabIconDefault: '#9CA3AF',
  tabIconSelected: '#1B6B2A',
  gradient: { start: '#1B6B2A', middle: '#2E8B3E', end: '#E8611A' },
};

// Palette sombre
export const darkColors = {
  primary: '#34A853',          // Vert plus lumineux sur fond sombre
  primaryDark: '#2E8B3E',
  primaryLight: '#4ABA67',
  secondary: '#F0823E',
  secondaryLight: '#F5A06A',
  orange: '#F0823E',
  orangeLight: '#F5B080',
  green: '#34A853',
  greenLight: '#4ABA67',
  magenta: '#F0823E',
  purple: '#34A853',
  pink: '#F0823E',
  success: '#34A853',
  warning: '#FFD23F',
  error: '#FF6B8A',
  background: '#0F1117',       // Fond très sombre
  surface: '#1A1D27',          // Surface sombre
  text: '#F3F4F6',             // Texte clair
  textSecondary: '#9CA3AF',
  border: '#2D3748',
  tabIconDefault: '#6B7280',
  tabIconSelected: '#34A853',
  gradient: { start: '#1B6B2A', middle: '#2E8B3E', end: '#E8611A' },
};

export type ThemeColors = typeof lightColors;

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [loaded, setLoaded] = useState(false);

  // Charger la préférence sauvegardée
  useEffect(() => {
    loadFromStorage<boolean>(STORAGE_KEY).then((saved) => {
      if (saved !== null && saved !== undefined) {
        setIsDark(saved);
      } else {
        // Utiliser la préférence système par défaut
        setIsDark(Appearance.getColorScheme() === 'dark');
      }
      setLoaded(true);
    });
  }, []);

  const toggleTheme = useCallback(async () => {
    const next = !isDark;
    setIsDark(next);
    await saveToStorage(STORAGE_KEY, next);
  }, [isDark]);

  const colors: ThemeColors = useMemo(() => isDark ? darkColors : lightColors, [isDark]);

  return useMemo(() => ({
    isDark,
    loaded,
    colors,
    toggleTheme,
  }), [isDark, loaded, colors, toggleTheme]);
});
