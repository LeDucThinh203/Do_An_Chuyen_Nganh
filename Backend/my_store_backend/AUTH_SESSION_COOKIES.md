# Cookie based JWT session

The API stores its JWT in the `coolshop_session` cookie with `HttpOnly`, `Secure`
in production, and `SameSite=None` by default. The browser never receives the
JWT in JSON or stores it in `localStorage`. The short-lived support socket ticket
is scoped to Socket.IO and expires after one minute.

Browser mutations use a separate `coolshop_csrf` cookie and the
`X-CSRF-Token` header. The API rejects browser mutations from origins outside
`FRONTEND_ORIGINS` (or the configured `FRONTEND_URL`). Keep these origins
explicit and comma separated.

## Deployment settings

- Backend: set a random `JWT_SECRET` of at least 32 characters.
- Backend: set `FRONTEND_ORIGINS` to the exact frontend origins, for example
  `https://webshop123.netlify.app`.
- Netlify: set `REACT_APP_API_URL=/api`; `netlify.toml` proxies `/api/*` to the
  Render API so the browser sees a first-party API cookie.
- Direct cross-origin frontend deployments can set `REACT_APP_API_URL` to the
  backend URL. They also need the frontend origin in `FRONTEND_ORIGINS`; browser
  privacy settings may block third-party cookies, so a same-origin proxy is
  preferred.
- Local Docker may use `COOKIE_SECURE=false` and `COOKIE_SAME_SITE=lax` behind
  the local Nginx proxy. Do not use that cookie configuration on a public site.

Legacy `token` and `user` values are deleted from browser local storage when the
new frontend loads. The current user profile is held in memory and restored from
`GET /account/me` after a page reload.
