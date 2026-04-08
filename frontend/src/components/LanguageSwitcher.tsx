import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { supportedLanguages, languageNames, type SupportedLanguage } from '@/lib/i18n';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 hover:bg-muted rounded-lg transition-colors"
        aria-label="Change language"
      >
        <Globe className="w-5 h-5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-1">
            {supportedLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() => changeLanguage(lang)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                  i18n.language === lang
                    ? 'bg-green-500/10 text-green-600 font-medium'
                    : 'hover:bg-muted'
                }`}
              >
                {languageNames[lang]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
