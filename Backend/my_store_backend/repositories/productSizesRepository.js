import db from '../db.js';

export const getAllProductSizes = async () => {
  const [rows] = await db.query('SELECT * FROM product_sizes');
  return rows;
};

export const getProductSizeById = async (id) => {
  const [rows] = await db.query('SELECT * FROM product_sizes WHERE id=?', [id]);
  return rows[0] || null;
};

export const createProductSize = async ({ product_id, size_id, stock = 0 }) => {
  const [result] = await db.query(
    'INSERT INTO product_sizes (product_id, size_id, stock) VALUES (?, ?, ?)',
    [product_id, size_id, stock]
  );
  return result.insertId;
};

export const updateProductSize = async (id, data) => {
  const fields = [];
  const values = [];
  
  if (data.product_id !== undefined) {
    fields.push('product_id=?');
    values.push(data.product_id);
  }
  if (data.size_id !== undefined) {
    fields.push('size_id=?');
    values.push(data.size_id);
  }
  if (data.stock !== undefined) {
    fields.push('stock=?');
    values.push(data.stock);
  }
  
  if (fields.length === 0) return;
  
  values.push(id);
  await db.query(
    `UPDATE product_sizes SET ${fields.join(', ')} WHERE id=?`,
    values
  );
};

export const deleteProductSize = async (id) => {
  await db.query('DELETE FROM product_sizes WHERE id=?', [id]);
};
