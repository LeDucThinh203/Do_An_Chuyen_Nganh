import 'dotenv/config';
import crypto from 'crypto';

export const CSRF_COOKIE_NAME = 'coolshop_csrf';
const isProduction = process.env.NODE_ENV === 'production';
const cookieSecure = process.env.COOKIE_SECURE === undefined
  ? isProduction
  : process.env.COOKIE_SECURE === 'true';
const cookieSameSite = process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax');

const configuredOrigins = [
  ...(process.env.FRONTEND_ORIGINS || '').split(/[\s,]+/),
  process.env.FRONTEND_URL,
  process.env.FRONTEND_ORIGIN,
  process.env.FONTEND_URL,
  'https://webshop123.netlify.app',
  'http://localhost',
  'http://127.0.0.1',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3006',
  'http://127.0.0.1:3006',
  process.env.RENDER_EXTERNAL_URL,
].filter(Boolean);

export const allowedOrigins = [...new Set(configuredOrigins.map((value) => {
  try {
    return new URL(String(value).includes('://') ? value : `https://${value}`).origin;
  } catch {
    return null;
  }
}).filter(Boolean))];

const parseCookies = (header = '') => Object.fromEntries(
  String(header)
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separator = part.indexOf('=');
      const name = separator < 0 ? part : part.slice(0, separator);
      const value = separator < 0 ? '' : part.slice(separator + 1);
      try {
        return [name, decodeURIComponent(value)];
      } catch {
        return [name, value];
      }
    })
);

export const getCsrfTokenFromRequest = (req) => parseCookies(req.headers.cookie)[CSRF_COOKIE_NAME] || null;

export const issueCsrfToken = (req, res) => {
  const current = getCsrfTokenFromRequest(req);
  const token = current || crypto.randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: cookieSecure,
    sameSite: cookieSameSite,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.set('Cache-Control', 'no-store');
  return res.json({ csrfToken: token });
};

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

export const csrfProtection = (req, res, next) => {
  if (safeMethods.has(req.method.toUpperCase())) return next();

  const origin = req.get('origin');
  // Non-browser API clients generally omit Origin. Browser requests must prove
  // both a trusted origin and possession of the CSRF cookie value.
  if (!origin) return next();
  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Nguồn gửi yêu cầu không được phép' });
  }

  const cookieToken = getCsrfTokenFromRequest(req) || '';
  const headerToken = String(req.get('x-csrf-token') || '');
  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);
  if (!cookieToken || cookieBuffer.length !== headerBuffer.length || !crypto.timingSafeEqual(cookieBuffer, headerBuffer)) {
    return res.status(403).json({ error: 'CSRF token không hợp lệ. Hãy tải lại trang và thử lại.' });
  }

  return next();
};

export default { allowedOrigins, issueCsrfToken, csrfProtection };
