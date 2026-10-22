import 'dotenv/config';
import jwt from 'jsonwebtoken';

const isProduction = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || (isProduction ? '' : 'local-development-only-secret');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const AUTH_COOKIE_NAME = 'coolshop_session';
const cookieSecure = process.env.COOKIE_SECURE === undefined
  ? isProduction
  : process.env.COOKIE_SECURE === 'true';
const cookieSameSite = process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax');

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured in production before starting the API.');
}
if (isProduction && JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must contain at least 32 characters in production.');
}

const authCookieOptions = {
  httpOnly: true,
  secure: cookieSecure,
  sameSite: cookieSameSite,
  path: '/',
};

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

export const getAuthTokenFromRequest = (req) => parseCookies(req.headers.cookie)[AUTH_COOKIE_NAME] || null;

export const generateToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

export const setAuthCookie = (res, token) => {
  const expiration = Number(jwt.decode(token)?.exp || 0) * 1000;
  const maxAge = expiration ? Math.max(0, expiration - Date.now()) : 7 * 24 * 60 * 60 * 1000;
  res.cookie(AUTH_COOKIE_NAME, token, { ...authCookieOptions, maxAge });
};

export const clearAuthCookie = (res) => res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions);

export const verifyToken = (token) => {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

export const generateSupportSocketTicket = (user) => jwt.sign(
  {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    scope: 'support:socket',
    sessionExp: user.exp,
  },
  JWT_SECRET,
  { expiresIn: '60s', audience: 'support-socket' }
);

export const verifySupportSocketTicket = (ticket) => {
  try {
    const payload = jwt.verify(ticket, JWT_SECRET, { audience: 'support-socket' });
    return payload.scope === 'support:socket' ? payload : null;
  } catch {
    return null;
  }
};

export const authenticate = (req, res, next) => {
  const decoded = verifyToken(getAuthTokenFromRequest(req));
  if (!decoded) return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' });
  req.user = decoded;
  return next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Chưa xác thực' });
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Không có quyền truy cập. Yêu cầu quyền admin' });
  }
  return next();
};

export const requireUser = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Chưa xác thực' });
  if (req.user.role !== 'user' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Không có quyền truy cập' });
  }
  return next();
};

export const requireSelfOrAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Chưa xác thực' });
  if (Number(req.user.id) !== Number(req.params.id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Không có quyền truy cập tài nguyên này' });
  }
  return next();
};

export const optionalAuth = (req, res, next) => {
  req.user = verifyToken(getAuthTokenFromRequest(req)) || null;
  return next();
};

export default {
  generateToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
  getAuthTokenFromRequest,
  generateSupportSocketTicket,
  verifySupportSocketTicket,
  authenticate,
  requireAdmin,
  requireUser,
  requireSelfOrAdmin,
  optionalAuth,
};
