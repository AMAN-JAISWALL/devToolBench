/**
 * i18n configuration shared by the Layout, the sitemap, and the client
 * language switcher.
 *
 * Locales with real translated pages get static routes under /{locale}/…
 * and hreflang clusters. All other languages stay on the English page and
 * are handled client-side by the Google Translate widget.
 */

export const defaultLocale = 'en';

/** Locales that have real translated pages (static routes). */
export const locales = ['en', 'hi', 'es'] as const;
export type Locale = (typeof locales)[number];

/** og:locale value per locale. */
export const ogLocales: Record<Locale, string> = {
  en: 'en_US',
  hi: 'hi_IN',
  es: 'es_ES',
};

/**
 * Base paths (no locale prefix, no trailing slash) that exist translated
 * in every locale above. Only these emit hreflang clusters.
 */
export const translatedPaths = ['/', '/breach-checker', '/speed-test', '/fake-data-generator'];

/** Strip a leading locale prefix: '/hi/speed-test' -> '/speed-test'. */
export function stripLocale(pathname: string): string {
  for (const l of locales) {
    if (l === defaultLocale) continue;
    if (pathname === `/${l}` || pathname === `/${l}/`) return '/';
    if (pathname.startsWith(`/${l}/`)) return pathname.slice(l.length + 1);
  }
  return pathname;
}

/** Localized URL path with trailing slash: localizedPath('hi', '/speed-test') -> '/hi/speed-test/'. */
export function localizedPath(locale: Locale, basePath: string): string {
  const p = basePath === '/' ? '' : basePath;
  return locale === defaultLocale ? `${p}/` : `/${locale}${p}/`;
}

/** Does this base path have a full translation cluster? */
export function isTranslatedPath(basePath: string): boolean {
  return translatedPaths.includes(basePath === '' ? '/' : basePath);
}
