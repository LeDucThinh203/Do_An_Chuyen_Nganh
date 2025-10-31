import db from '../db.js';

export const getAllProductSizes = async () => {
  const [rows] = await db.query('SELECT * FROM product_sizes');
  return rows;
};

export const getProductSizeById = async (id) => {
  const [rows] = await db.query('SELECT * FROM product_sizes WHERE id=?', [id]);
  return rows[0] || null;
};

export const createProductSize = async ({ product_id, size_id }) => {
  const [result] = await db.query(
    'INSERT INTO product_sizes (product_id, size_id) VALUES (?, ?)',
    [product_id, size_id]
  );
  return result.insertId;
};

export const updateProductSize = async (id, { product_id, size_id }) => {
  await db.query(
    'UPDATE product_sizes SET product_id=?, size_id=? WHERE id=?',
    [product_id, size_id, id]
  );
};

export const deleteProductSize = async (id) => {
  await db.query('DELETE FROM product_sizes WHERE id=?', [id]);
};
