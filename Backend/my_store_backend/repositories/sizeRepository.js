import db from '../db.js';

export const getAllSizes = async () => {
  const [rows] = await db.query('SELECT * FROM sizes');
  return rows;
};

export const getSizeById = async (id) => {
  const [rows] = await db.query('SELECT * FROM sizes WHERE id=?', [id]);
  return rows[0] || null;
};

export const createSize = async ({ size }) => {
  const [result] = await db.query('INSERT INTO sizes (size) VALUES (?)', [size]);
  return result.insertId;
};

export const updateSize = async (id, { size }) => {
  await db.query('UPDATE sizes SET size=? WHERE id=?', [size, id]);
};

export const deleteSize = async (id) => {
  await db.query('DELETE FROM sizes WHERE id=?', [id]);
};
