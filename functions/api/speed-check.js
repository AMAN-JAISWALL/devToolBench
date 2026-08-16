// Cloudflare Pages Function: POST /api/speed-check
// Proxies Google PageSpeed Insights API so the secret key stays server-side.
// Time spent awaiting Google's response is I/O wait, not CPU time, so this
// stays within the Pages free-tier CPU limit even though each audit takes seconds.

const MAX_URLS = 10;
const CONCURRENCY = 3;

export const onRequestPost = async (context) => {
  const env = context.env || {};
  const apiKey = env.PAGESPEED_API_KEY;
  if (!apiKey) {
    return json({ error: 'Server is missing the PAGESPEED_API_KEY environment variable.' }, 500);
  }

  let urls;
  try {
    const body = await context.request.json();
    urls = body?.urls;
  } catch {
    return json({ error: 'Request body must be JSON.' }, 400);
  }

  if (!Array.isArray(urls) || urls.length === 0) {
    return json({ error: 'Provide a non-empty "urls" array.' }, 400);
  }

  // Re-validate and re-cap server-side — never trust the client alone.
  const normalized = urls
    .filter((u) => typeof u === 'string')
    .map((u) => u.trim())
    .filter((u) => u.length > 0)
    .slice(0, MAX_URLS);

  if (normalized.length === 0) {
    return json({ error: 'No valid URLs in request.' }, 400);
  }

  // Process with limited concurrency (batches of 3).
  const results = [];
  for (let i = 0; i < normalized.length; i += CONCURRENCY) {
    const batch = normalized.slice(i, i + CONCURRENCY);
    const settled = await Promise.all(batch.map((u) => checkUrl(u, apiKey)));
    results.push(...settled);
  }

  return json(results, 200);
};

async function checkUrl(rawUrl, apiKey) {
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  const base = { url, ok: false };

  try {
    const u = new URL(url);
    if (!u.hostname || !u.hostname.includes('.')) {
      return { ...base, error: 'Invalid URL.' };
    }
  } catch {
    return { ...base, error: 'Invalid URL.' };
  }

  const api = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${encodeURIComponent(apiKey)}&strategy=mobile&category=performance`;

  let data;
  try {
    const res = await fetch(api, { headers: { accept: 'application/json' } });
    if (!res.ok) {
      if (res.status === 429) {
        return { ...base, error: 'Rate-limited by the PageSpeed API. Try again shortly.' };
      }
      const detail = await res.json().catch(() => null);
      return {
        ...base,
        error: detail?.error?.message || `PageSpeed API returned ${res.status}.`,
      };
    }
    data = await res.json();
  } catch {
    return { ...base, error: 'Could not reach the PageSpeed API.' };
  }

  const lighthouse = data?.lighthouseResult;
  if (!lighthouse) {
    return { ...base, error: 'PageSpeed returned no audit result for this URL.' };
  }

  const score = Math.round((lighthouse.categories?.performance?.score ?? 0) * 100);
  const audits = lighthouse.audits ?? {};

  // Top opportunities: failed audits with estimated savings, best first, capped at 3.
  const opportunities = Object.values(audits)
    .filter(
      (a) =>
        a?.details?.type === 'opportunity' &&
        typeof a.numericValue === 'number' &&
        a.numericValue > 0 &&
        a.score !== null &&
        a.score !== 1
    )
    .sort((a, b) => b.numericValue - a.numericValue)
    .slice(0, 3)
    .map((a) => `${a.title} (saves ~${Math.round(a.numericValue)}ms)`);

  return {
    url,
    ok: true,
    score,
    lcp: audits['largest-contentful-paint']?.displayValue ?? '—',
    cls: audits['cumulative-layout-shift']?.displayValue ?? '—',
    tbt: audits['total-blocking-time']?.displayValue ?? '—',
    opportunities,
  };
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
