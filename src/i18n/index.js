import { createI18n } from 'vue-i18n';

import ar from './locales/ar.js';
import en from './locales/en.js';
import es from './locales/es.js';
import fr from './locales/fr.js';

export const LOCALE_STORAGE_KEY = 'feppm.locale';
export const DEFAULT_LOCALE = 'en';
export const supportedLocales = [
  { code: 'en', label: 'English', direction: 'ltr' },
  { code: 'fr', label: 'Français', direction: 'ltr' },
  { code: 'es', label: 'Español', direction: 'ltr' },
  { code: 'ar', label: 'العربية', direction: 'rtl' },
];

const supportedLocaleCodes = new Set(supportedLocales.map(({ code }) => code));

function normalizeLocale(value) {
  const code = String(value ?? '').toLowerCase().split('-')[0];
  return supportedLocaleCodes.has(code) ? code : DEFAULT_LOCALE;
}

function detectInitialLocale() {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (savedLocale && supportedLocaleCodes.has(savedLocale)) return savedLocale;

  return normalizeLocale(window.navigator.language);
}

export function syncDocumentLocale(locale) {
  if (typeof document === 'undefined') return;
  const normalizedLocale = normalizeLocale(locale);
  const localeDefinition = supportedLocales.find(({ code }) => code === normalizedLocale);
  document.documentElement.lang = normalizedLocale;
  document.documentElement.dir = localeDefinition?.direction ?? 'ltr';
}

const initialLocale = detectInitialLocale();

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: initialLocale,
  fallbackLocale: DEFAULT_LOCALE,
  messages: { en, fr, es, ar },
});

export function setAppLocale(locale) {
  const normalizedLocale = normalizeLocale(locale);
  i18n.global.locale.value = normalizedLocale;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, normalizedLocale);
  }
  syncDocumentLocale(normalizedLocale);
}

syncDocumentLocale(initialLocale);

export default i18n;
