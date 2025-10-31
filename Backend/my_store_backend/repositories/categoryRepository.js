import db from '../db.js';

export const getAllCategories = async () => {
  const [rows] = await db.query('SELECT * FROM category');
  return rows;
};

export const getCategoryById = async (id) => {
  const [rows] = await db.query('SELECT * FROM category WHERE id=?', [id]);
  return rows[0] || null;
};

export const createCategory = async ({ name, description }) => {
  const [result] = await db.query(
    'INSERT INTO category (name, description) VALUES (?, ?)',
    [name, description]
  );
  return result.insertId;
};

export const updateCategory = async (id, { name, description }) => {
  await db.query(
    'UPDATE category SET name=?, description=? WHERE id=?',
    [name, description, id]
  );
};

export const deleteCategory = async (id) => {
  await db.query('DELETE FROM category WHERE id=?', [id]);
};
