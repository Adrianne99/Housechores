// Cloudflare Pages Function: forwards /api/* to the backend (Render), so the
// app and its API share one site and the login cookie is first-party
// (Safari / iPhone block cookies set by a different site).
// Set BACKEND_URL in Pages → Settings → Variables, e.g. https://grocery-api.onrender.com
// ponytail: every visitor reaches the backend through Cloudflare's IPs, so the
// login rate limit (20 tries / 15 min) is shared more broadly; fine for one store.
export const onRequest = ({ request, env }) => {
  const url = new URL(request.url);
  return fetch(new Request(env.BACKEND_URL.replace(/\/$/, "") + url.pathname + url.search, request));
};
