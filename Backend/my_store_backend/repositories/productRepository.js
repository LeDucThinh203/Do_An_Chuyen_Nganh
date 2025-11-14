import db from '../db.js';

export const getAllProducts = async () => {
  const [rows] = await db.query('SELECT * FROM product');
  return rows;
};

export const getProductById = async (id) => {
  const [rows] = await db.query('SELECT * FROM product WHERE id=?', [id]);
  return rows[0] || null;
};

export const createProduct = async ({ name, description, price, image, category_id, discount_percent = 0 }) => {
  const [result] = await db.query(
    'INSERT INTO product (name, description, price, image, category_id, discount_percent) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description, price, image, category_id, discount_percent]
  );
  return result.insertId;
};

export const updateProduct = async (id, data) => {
  const fields = [];
  const values = [];
  
  if (data.name !== undefined) {
    fields.push('name=?');
    values.push(data.name);
  }
  if (data.description !== undefined) {
    fields.push('description=?');
    values.push(data.description);
  }
  if (data.price !== undefined) {
    fields.push('price=?');
    values.push(data.price);
  }
  if (data.image !== undefined) {
    fields.push('image=?');
    values.push(data.image);
  }
  if (data.category_id !== undefined) {
    fields.push('category_id=?');
    values.push(data.category_id);
  }
  if (data.discount_percent !== undefined) {
    fields.push('discount_percent=?');
    values.push(data.discount_percent);
  }
  
  if (fields.length === 0) return;
  
  values.push(id);
  await db.query(
    `UPDATE product SET ${fields.join(', ')} WHERE id=?`,
    values
  );
};

export const deleteProduct = async (id) => {
  await db.query('DELETE FROM product WHERE id=?', [id]);
};
