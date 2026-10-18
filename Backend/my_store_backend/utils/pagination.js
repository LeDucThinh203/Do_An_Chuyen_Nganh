const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export const parseLimit = (value, fallback = DEFAULT_LIMIT) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, MAX_LIMIT);
};

export const encodeCursor = (value) =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

export const decodeCursor = (value) => {
  if (typeof value !== 'string' || value.length > 512) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};
