import db from '../db.js';

export const getAllAccounts = async () => {
  const [rows] = await db.query('SELECT * FROM account');
  return rows;
};

export const getAccountById = async (id) => {
  const [rows] = await db.query('SELECT * FROM account WHERE id=?', [id]);
  return rows[0] || null;
};

export const createAccount = async ({ email, username, password, role }) => {
  const [result] = await db.query(
    'INSERT INTO account (email, username, password, role) VALUES (?, ?, ?, ?)',
    [email, username, password, role]
  );
  return result.insertId;
};

export const updateAccount = async (id, { email, username, password, role }) => {
  await db.query(
    'UPDATE account SET email=?, username=?, password=?, role=? WHERE id=?',
    [email, username, password, role, id]
  );
};

export const deleteAccount = async (id) => {
  await db.query('DELETE FROM account WHERE id=?', [id]);
};
