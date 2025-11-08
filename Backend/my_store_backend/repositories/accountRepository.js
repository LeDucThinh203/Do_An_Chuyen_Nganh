import db from '../db.js';
import bcrypt from 'bcryptjs';

/** Lấy tất cả tài khoản */
export const getAllAccounts = async () => {
  const [rows] = await db.query('SELECT * FROM account');
  return rows;
};

/** Lấy tài khoản theo ID */
export const getAccountById = async (id) => {
  const [rows] = await db.query('SELECT * FROM account WHERE id=?', [id]);
  return rows[0] || null;
};

/** Lấy tài khoản theo email */
export const getAccountByEmail = async (email) => {
  const [rows] = await db.query('SELECT * FROM account WHERE email=?', [email]);
  return rows[0] || null;
};

/** Tạo tài khoản mới */
export const createAccount = async ({ email, username, password, role }) => {
  const [result] = await db.query(
    'INSERT INTO account (email, username, password, role) VALUES (?, ?, ?, ?)',
    [email, username, password, role]
  );
  return result.insertId;
};

/** Cập nhật tài khoản */
export const updateAccount = async (id, { email, username, password, role }) => {
  // Lấy thông tin account hiện tại
  const [rows] = await db.query('SELECT * FROM account WHERE id=?', [id]);
  if (!rows[0]) throw new Error('Account không tồn tại');

  const account = rows[0];

  // Nếu có password mới thì hash, nếu không giữ nguyên password cũ
  const newPassword = password ? await bcrypt.hash(password, 10) : account.password;

  await db.query(
    'UPDATE account SET email=?, username=?, password=?, role=? WHERE id=?',
    [
      email || account.email,
      username || account.username,
      newPassword,
      role || account.role,
      id
    ]
  );
};

/** Xóa tài khoản */
export const deleteAccount = async (id) => {
  await db.query('DELETE FROM account WHERE id=?', [id]);
};
