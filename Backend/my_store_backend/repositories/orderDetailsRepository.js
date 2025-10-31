import db from '../db.js';

export const getAllOrderDetails = async () => {
  const [rows] = await db.query('SELECT * FROM order_details');
  return rows;
};

export const getOrderDetailById = async (id) => {
  const [rows] = await db.query('SELECT * FROM order_details WHERE id=?', [id]);
  return rows[0] || null;
};

export const createOrderDetail = async ({ order_id, product_sizes_id, quantity, price }) => {
  const [result] = await db.query(
    'INSERT INTO order_details (order_id, product_sizes_id, quantity, price) VALUES (?, ?, ?, ?)',
    [order_id, product_sizes_id, quantity, price]
  );
  return result.insertId;
};

export const updateOrderDetail = async (id, { order_id, product_sizes_id, quantity, price }) => {
  await db.query(
    'UPDATE order_details SET order_id=?, product_sizes_id=?, quantity=?, price=? WHERE id=?',
    [order_id, product_sizes_id, quantity, price, id]
  );
};

export const deleteOrderDetail = async (id) => {
  await db.query('DELETE FROM order_details WHERE id=?', [id]);
};
