import { MdCheck, MdExpandMore, MdPublic, MdSync } from 'react-icons/md';
import { useEffect, useState, useCallback, ReactNode } from 'react';

// Supported languages for Google Translate
export const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
];

// Declare global window types for Google Translate
declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: {
      translate: {
        TranslateElement: {
          new (options: {
            pageLanguage: string;
            includedLanguages: string;
            layout: number;
            autoDisplay: boolean;
          }, elementId: string): void;
          InlineLayout: {
            SIMPLE: number;
            HORIZONTAL: number;
            VERTICAL: number;
          };
        };
      };
    };
    _googleTranslateReady?: boolean;
  }
}

function getGoogleTranslateSelect(): HTMLSelectElement | null {
  return document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
}

function triggerTranslate(langCode: string) {
  const select = getGoogleTranslateSelect();
  if (select) {
    select.value = langCode;
    select.dispatchEvent(new Event('change'));
    return true;
  }
  return false;
}

// Provider that initializes Google Translate
export function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (document.getElementById('google-translate-script')) return;

    window.googleTranslateElementInit = () => {
      if (window.google?.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: languages.map(l => l.code).join(','),
            layout: window.google.translate.TranslateElement.InlineLayout?.SIMPLE || 0,
            autoDisplay: false,
          },
          'google_translate_element'
        );
        window._googleTranslateReady = true;

        // Auto-apply saved language after Google Translate initializes
        const saved = localStorage.getItem('finops_language');
        if (saved && saved !== 'en') {
          // Small delay to let Google Translate fully render
          setTimeout(() => triggerTranslate(saved), 300);
        }
      }
    };

    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);

    const style = document.createElement('style');
    style.id = 'google-translate-style';
    style.textContent = `
      .goog-te-banner-frame,
      .skiptranslate:not(#google_translate_element),
      #goog-gt-tt,
      .goog-te-balloon-frame,
      .goog-tooltip,
      .goog-tooltip:hover,
      div#goog-gt-,
      .goog-te-spinner-pos,
      .goog-te-gadget-icon,
      iframe.goog-te-menu-frame,
      .goog-te-menu-value span:not(:first-child),
      .VIpgJd-ZVi9od-l4eHX-hSRGPd,
      .VIpgJd-ZVi9od-ORHb-OEVmcd,
      .VIpgJd-ZVi9od-aZ2wEe-wOHMyf {
        display: none !important;
      }
      body { top: 0 !important; }
      #google_translate_element {
        position: absolute;
        left: -9999px;
        top: -9999px;
        visibility: hidden;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const scriptEl = document.getElementById('google-translate-script');
      const styleEl = document.getElementById('google-translate-style');
      if (scriptEl) scriptEl.remove();
      if (styleEl) styleEl.remove();
    };
  }, []);

  return (
    <>
      <div id="google_translate_element" />
      {children}
    </>
  );
}

// Custom language selector that triggers Google Translate
export function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState(() => localStorage.getItem('finops_language') || 'en');
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const changeLanguage = useCallback((langCode: string) => {
    setIsOpen(false);
    if (langCode === currentLang) return;

    setCurrentLang(langCode);
    localStorage.setItem('finops_language', langCode);
    setSwitching(true);

    if (langCode === 'en') {
      // Reset: clear cookie and switch Google Translate back to English
      document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
      document.cookie = `googtrans=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
      triggerTranslate('en');
      setTimeout(() => setSwitching(false), 600);
      return;
    }

    // Set cookies for Google Translate
    document.cookie = `googtrans=/en/${langCode}; path=/`;
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname}`;

    // Try immediately
    if (triggerTranslate(langCode)) {
      setTimeout(() => setSwitching(false), 600);
      return;
    }

    // If not ready, poll until it is
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (triggerTranslate(langCode) || attempts > 20) {
        clearInterval(interval);
        setSwitching(false);
      }
    }, 300);
  }, [currentLang]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.lang-selector-container')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const currentLanguage = languages.find(l => l.code === currentLang) || languages[0];

  return (
    <div className="relative lang-selector-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-border bg-background/50 hover:bg-accent transition-all duration-200"
        aria-label="Select language"
        aria-expanded={isOpen}
        data-testid="language-selector"
        disabled={switching}
      >
        {switching ? (
          <MdSync className="h-4 w-4 text-muted-foreground animate-spin" />
        ) : (
          <MdPublic className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="hidden sm:inline text-foreground notranslate">{currentLanguage.nativeName}</span>
        <MdExpandMore className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 py-2 bg-popover border border-popover-border rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider notranslate">Select Language</p>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`notranslate w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors duration-150 ${
                  currentLang === lang.code
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                <span className="flex-1 text-left">{lang.nativeName}</span>
                <span className="text-xs text-muted-foreground">{lang.name}</span>
                {currentLang === lang.code && (
                  <MdCheck className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
          <div className="px-3 py-2 border-t border-border">
            <p className="text-xs text-muted-foreground flex items-center gap-1 notranslate">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
              </svg>
              Powered by Google Translate
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
