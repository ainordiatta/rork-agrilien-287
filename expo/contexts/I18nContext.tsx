import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'fr' | 'wo';

type TranslationDictionary = Record<string, string>;

const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  fr: {
    'nav.home': 'Accueil',
    'nav.search': 'Rechercher',
    'nav.cart': 'Panier',
    'nav.calendar': 'Calendrier',
    'nav.profile': 'Profil',
    'nav.map': 'Carte',
    'home.welcome': 'Bienvenue sur AgriLien',
    'home.searchPlaceholder': 'Rechercher...',
    'profile.settings': 'Paramètres',
    'profile.language': 'Langue',
    'profile.theme': 'Mode sombre',
    'common.available': 'Disponible',
    'common.buy': 'Acheter',
    'common.joinGroupBuy': 'Rejoindre l\'achat groupé',
    'product.price': 'Prix',
    'product.stock': 'Stock',
    'offline.banner': 'Mode Hors-ligne : Catalogue en cache',
  },
  wo: {
    'nav.home': 'Kër gi',
    'nav.search': 'Seet',
    'nav.cart': 'Mbaal',
    'nav.calendar': 'Arminaat',
    'nav.profile': 'Sama kàddu',
    'nav.map': 'Kàrt',
    'home.welcome': 'Dalal jàmm ci AgriLien',
    'home.searchPlaceholder': 'Seet fi...',
    'profile.settings': 'Jekkal',
    'profile.language': 'Làmmiñ',
    'profile.theme': 'Lëndëm',
    'common.available': 'Am na',
    'common.buy': 'Jënd',
    'common.joinGroupBuy': 'Bokk ci mbotaay gi',
    'product.price': 'Njeg',
    'product.stock': 'Li des',
    'offline.banner': 'Doxul ak net : Kàttalog bi rek lay woné',
  }
};

const LANGUAGE_KEY = '@app/language';

export const [I18nProvider, useI18n] = createContextHook(() => {
  const [language, setLanguage] = useState<Language>('fr');

  useEffect(() => {
    void loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (stored === 'fr' || stored === 'wo') {
        setLanguage(stored as Language);
      }
    } catch (e) {
      console.error('[I18n] Failed to load language', e);
    }
  };

  const changeLanguage = useCallback(async (lang: Language) => {
    setLanguage(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    } catch (e) {
      console.error('[I18n] Failed to save language', e);
    }
  }, []);

  const t = useCallback((key: string): string => {
    const text = TRANSLATIONS[language]?.[key];
    return text || key; // Fallback to key if not found
  }, [language]);

  return useMemo(
    () => ({
      language,
      changeLanguage,
      t,
    }),
    [language, changeLanguage, t]
  );
});
