import { configureLocalization } from '@lit/localize';

import { sourceLocale, targetLocales } from '../../generated/locale-codes';

export const { getLocale, setLocale } = configureLocalization({
  sourceLocale,
  targetLocales: [...targetLocales],
  loadLocale: async (locale) => {
    if (locale === 'ja') {
      return await import('../../generated/locales/ja');
    }
    throw new Error(`Unsupported locale: ${locale}`);
  },
});
