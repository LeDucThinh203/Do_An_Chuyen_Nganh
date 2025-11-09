import db from '../db.js';
import bcrypt from 'bcryptjs';

/** ================= Account ================= */
export const getAllAccounts = async () => {
  const [rows] = await db.query('SELECT * FROM account');
  return rows;
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
