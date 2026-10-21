import db from '../db.js';
import bcrypt from 'bcryptjs';
import { encodeCursor } from '../utils/pagination.js';

/** ================= Account ================= */
export const getAllAccounts = async () => {
  const [rows] = await db.query(
    'SELECT id, email, username, role, created_at, updated_at FROM account ORDER BY id DESC'
  );
  return rows;
};

export const getAccountsPage = async ({ limit = 25, cursor = null, query = '' } = {}) => {
  const search = String(query || '').trim();
  const conditions = [];
  const values = [];
  if (search) {
    conditions.push('(email ILIKE ? OR username ILIKE ?)');
    values.push(`%${search}%`, `%${search}%`);
  }
  const filterSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const totalPromise = cursor
    ? Promise.resolve(null)
    : db.query(`SELECT COUNT(*)::integer AS total FROM account ${filterSql}`, values)
        .then(([rows]) => Number(rows[0]?.total || 0));

  const pageConditions = [...conditions];
  const pageValues = [...values];
  if (cursor?.id != null && Number.isInteger(Number(cursor.id))) {
    pageConditions.push('id < ?');
    pageValues.push(cursor.id);
  }
  pageValues.push(limit + 1);

  const [pageResult, total] = await Promise.all([
    db.query(
      `SELECT id, email, username, role, created_at, updated_at
       FROM account
       ${pageConditions.length ? `WHERE ${pageConditions.join(' AND ')}` : ''}
       ORDER BY id DESC
       LIMIT ?`,
      pageValues
    ),
    totalPromise,
  ]);
  const [rows] = pageResult;
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore && data.length ? encodeCursor({ id: data[data.length - 1].id }) : null;
  return { data, pagination: { limit, hasMore, nextCursor, total } };
};

export const getAdminEmails = async () => {
  const [rows] = await db.query(
    `SELECT DISTINCT email
     FROM account
     WHERE LOWER(role) = 'admin' AND email IS NOT NULL AND email <> ''`
  );
  return rows.map((row) => row.email);
};

export const getAccountById = async (id) => {
  const [rows] = await db.query('SELECT * FROM account WHERE id=?', [id]);
  return rows[0] || null;
};

export const getAccountByEmail = async (email) => {
  const [rows] = await db.query('SELECT * FROM account WHERE email=?', [email]);
  return rows[0] || null;
};

export const createAccount = async ({ email, username, password, role }) => {
  const [result] = await db.query(
    'INSERT INTO account (email, username, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
    [email, username, password, role]
  );
  return result.insertId;
};

export const updateAccount = async (id, { email, username, password, role }) => {
  const [rows] = await db.query('SELECT * FROM account WHERE id=?', [id]);
  if (!rows[0]) throw new Error('Account không tồn tại');

  const account = rows[0];
  const newPassword = password ? await bcrypt.hash(password, 10) : account.password;

  await db.query(
    'UPDATE account SET email=?, username=?, password=?, role=?, updated_at=NOW() WHERE id=?',
    [email || account.email, username || account.username, newPassword, role || account.role, id]
  );
};

export const deleteAccount = async (id) => {
  await db.query('DELETE FROM account WHERE id=?', [id]);
};

/** ================= Reset password ================= */
export const saveResetToken = async (id, token, expiryDate) => {
  // expiryDate là đối tượng Date hoặc string 'YYYY-MM-DD HH:MM:SS'
  await db.query(
    'UPDATE account SET reset_token=?, reset_token_expiry=?, updated_at=NOW() WHERE id=?',
    [token, expiryDate, id]
  );
};

export const getAccountByResetToken = async (token) => {
  const [rows] = await db.query('SELECT * FROM account WHERE reset_token=?', [token]);
  return rows[0] || null;
};

export const updateAccountPassword = async (id, hashedPassword) => {
  await db.query(
    'UPDATE account SET password=?, reset_token=NULL, reset_token_expiry=NULL, updated_at=NOW() WHERE id=?',
    [hashedPassword, id]
  );
};
