// Pages middleware: keep search engines on the production domain only.
//
// Cloudflare Pages serves identical content on devtoolbench.pages.dev and
// per-branch preview URLs (*.devtoolbench.pages.dev). To prevent duplicate
// content in search indexes, those hosts get an X-Robots-Tag: noindex
// response header (honored by Google and Bing, stronger than a meta tag),
// while devtoolbench.dev and www.devtoolbench.dev serve clean responses.
// Canonical tags on every page point to the live domain as a second layer.

const PRODUCTION_HOSTS = /^(www\.)?devtoolbench\.dev$/i;

export const onRequest = async (context) => {
  const response = await context.next();
  const host = context.request.headers.get('host') || '';

  if (PRODUCTION_HOSTS.test(host)) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
