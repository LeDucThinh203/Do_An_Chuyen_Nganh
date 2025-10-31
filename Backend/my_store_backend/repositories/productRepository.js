import db from '../db.js';

export const getAllProducts = async () => {
  const [rows] = await db.query('SELECT * FROM product');
  return rows;
};

export const getProductById = async (id) => {
  const [rows] = await db.query('SELECT * FROM product WHERE id=?', [id]);
  return rows[0] || null;
};

export const createProduct = async ({ name, description, price, image, category_id }) => {
  const [result] = await db.query(
    'INSERT INTO product (name, description, price, image, category_id) VALUES (?, ?, ?, ?, ?)',
    [name, description, price, image, category_id]
  );
  return result.insertId;
};

export const updateProduct = async (id, { name, description, price, image, category_id }) => {
  await db.query(
    'UPDATE product SET name=?, description=?, price=?, image=?, category_id=? WHERE id=?',
    [name, description, price, image, category_id, id]
  );
};

export const deleteProduct = async (id) => {
  await db.query('DELETE FROM product WHERE id=?', [id]);
};
