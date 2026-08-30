import idLocale from './id.json';
import enLocale from './en.json';
import { env } from '../config/env.config.js';
import { SupportedLocale } from '../types/config.types.js';

type LocaleRecord = Record<string, any>;

const locales: Record<SupportedLocale, LocaleRecord> = {
  id: idLocale,
  en: enLocale,
};

export class I18n {
  private defaultLocale: SupportedLocale;

  constructor() {
    this.defaultLocale = (env.DEFAULT_LOCALE as SupportedLocale) || 'id';
    if (!locales[this.defaultLocale]) {
      this.defaultLocale = 'id';
    }
  }

  /**
   * Translate a nested key (e.g. "errors.movie_not_found")
   */
  public t(key: string, params: Record<string, string | number> = {}, locale?: string): string {
    const selectedLocale: SupportedLocale =
      locale && locales[locale as SupportedLocale] ? (locale as SupportedLocale) : this.defaultLocale;

    const parts = key.split('.');
    let current: any = locales[selectedLocale];

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        // Fallback to default locale
        current = locales[this.defaultLocale];
        for (const fbPart of parts) {
          if (current && typeof current === 'object' && fbPart in current) {
            current = current[fbPart];
          } else {
            return key; // Return key if not found
          }
        }
        break;
      }
    }

    if (typeof current !== 'string') {
      return key;
    }

    // Replace {params}
    let translated = current;
    for (const [pKey, pVal] of Object.entries(params)) {
      translated = translated.replaceAll(`{${pKey}}`, String(pVal));
    }

    return translated;
  }
}

export const i18n = new I18n();
