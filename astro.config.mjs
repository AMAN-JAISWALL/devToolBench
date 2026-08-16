import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://devtoolbench.dev',
  output: 'static',
  // English stays at /, hi and es live under /hi/ and /es/
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'hi', 'es'],
    routing: { prefixOtherThanDefault: true },
  },
  integrations: [sitemap()],
});
