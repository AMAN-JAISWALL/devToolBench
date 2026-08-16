# DevToolbench

A free, ad-supported toolkit site for developers — live at **[devtoolbench.dev](https://devtoolbench.dev)**

Three independent tools, one fast static site, no accounts anywhere.

## Tools

| Tool | What it does |
|------|--------------|
| **Breach Checker** (`/breach-checker`) | Check if a password appears in known breaches (SHA-1 hashed locally, k-anonymity — the password never leaves the browser) and whether an email was exposed (XposedOrNot API) |
| **Bulk Speed Test** (`/speed-test`) | Test up to 10 URLs at once with Google PageSpeed — performance scores, Core Web Vitals, top fixes per site |
| **Fake Data Generator** (`/fake-data-generator`) | Up to 1,000 rows of realistic mock data (names, emails, UUIDs…) as JSON, CSV, or SQL — 100% client-side |

Available in **English, Hindi, and Spanish** with proper hreflang clusters.

## Tech stack

- [Astro](https://astro.build) — static output, zero UI-framework runtime
- Cloudflare Pages + Pages Functions (`functions/api/speed-check.js` proxies the PageSpeed API so the key stays server-side)
- `@faker-js/faker` bundled at build time
- `@astrojs/sitemap`, JSON-LD structured data, per-page canonical/OG/hreflang
- Microsoft Clarity (cookieless analytics, production domain only)

## Develop

```bash
npm install
npm run dev              # http://localhost:4321
```

Note: `/api/speed-check` only runs on Cloudflare Pages. To test it locally:

```bash
cp .dev.vars.example .dev.vars   # add your PageSpeed API key
npm run preview:pages            # builds + serves dist/ with Functions at :8788
```

## Deploy

**Option A — direct upload**
```bash
npm run build
npx wrangler pages deploy dist --project-name devtoolbench
```

**Option B — Git integration (recommended)**
Connect this repo in Cloudflare Pages:
- Build command: `npm run build`
- Output directory: `dist`

Then set `PAGESPEED_API_KEY` in **Settings → Environment Variables** (free key: Google Cloud Console → enable "PageSpeed Insights API"). Never commit it — `.dev.vars` is gitignored.

## After first deploy

- Add the custom domain `devtoolbench.dev` in the Pages project
- Verify `https://devtoolbench.dev/api/speed-check` responds
- Submit `https://devtoolbench.dev/sitemap.xml` in Google Search Console
- AdSense: uncomment the loader in `src/layouts/Layout.astro`, add your `ca-pub-` ID there and in `public/ads.txt`, and paste ad units into the `data-ad-slot` divs
