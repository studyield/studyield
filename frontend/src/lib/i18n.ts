import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from '@/locales/en.json';
import ja from '@/locales/ja.json';
import zh from '@/locales/zh.json';
import de from '@/locales/de.json';
import ko from '@/locales/ko.json';
import fr from '@/locales/fr.json';
import ptBR from '@/locales/pt-BR.json';
import it from '@/locales/it.json';
import nl from '@/locales/nl.json';
import es from '@/locales/es.json';
import uk from '@/locales/uk.json';
import ru from '@/locales/ru.json';
import ar from '@/locales/ar.json';
import bn from '@/locales/bn.json';
import hi from '@/locales/hi.json';

export const supportedLanguages = [
  'en', 'ja', 'zh', 'de', 'ko', 'fr', 'pt-BR', 'it', 'nl', 'es', 'uk', 'ru', 'ar', 'bn', 'hi',
] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const languageNames: Record<SupportedLanguage, string> = {
  en: 'English',
  ja: '日本語',
  zh: '中文',
  de: 'Deutsch',
  ko: '한국어',
  fr: 'Français',
  'pt-BR': 'Português (BR)',
  it: 'Italiano',
  nl: 'Nederlands',
  es: 'Español',
  uk: 'Українська',
  ru: 'Русский',
  ar: 'العربية',
  bn: 'বাংলা',
  hi: 'हिन्दी',
};

// Languages that require right-to-left text direction.
export const rtlLanguages: readonly SupportedLanguage[] = ['ar'];

export const isRtlLanguage = (lang: string): boolean =>
  rtlLanguages.includes(lang as SupportedLanguage);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ja: { translation: ja },
      zh: { translation: zh },
      de: { translation: de },
      ko: { translation: ko },
      fr: { translation: fr },
      'pt-BR': { translation: ptBR },
      it: { translation: it },
      nl: { translation: nl },
      es: { translation: es },
      uk: { translation: uk },
      ru: { translation: ru },
      ar: { translation: ar },
      bn: { translation: bn },
      hi: { translation: hi },
    },
    fallbackLng: 'en',
    supportedLngs: supportedLanguages,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
