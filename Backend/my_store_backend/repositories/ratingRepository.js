import db from '../db.js';

export const getAllRatings = async () => {
  const [rows] = await db.query('SELECT * FROM rating');
  return rows;
};

export const getRatingById = async (id) => {
  const [rows] = await db.query('SELECT * FROM rating WHERE id=?', [id]);
  return rows[0] || null;
};

export const createRating = async ({ rating_value, comment, order_detail_id }) => {
  const [result] = await db.query(
    'INSERT INTO rating (rating_value, comment, order_detail_id) VALUES (?, ?, ?)',
    [rating_value, comment, order_detail_id]
  );
  return result.insertId;
};

export const updateRating = async (id, { rating_value, comment, order_detail_id }) => {
  await db.query(
    'UPDATE rating SET rating_value=?, comment=?, order_detail_id=? WHERE id=?',
    [rating_value, comment, order_detail_id, id]
  );
};

export const deleteRating = async (id) => {
  await db.query('DELETE FROM rating WHERE id=?', [id]);
};
