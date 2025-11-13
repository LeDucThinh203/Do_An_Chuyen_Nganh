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

// Partial update: only update fields provided.
// Supports admin reply fields if the columns exist in DB: admin_reply, replied_by, replied_at
export const updateRating = async (id, data) => {
  const fields = [];
  const values = [];

  if (data.rating_value !== undefined) {
    fields.push('rating_value=?');
    values.push(data.rating_value);
  }
  if (data.comment !== undefined) {
    fields.push('comment=?');
    values.push(data.comment);
  }
  if (data.order_detail_id !== undefined) {
    fields.push('order_detail_id=?');
    values.push(data.order_detail_id);
  }
  if (data.admin_reply !== undefined) {
    fields.push('admin_reply=?');
    values.push(data.admin_reply);
  }
  if (data.replied_by !== undefined) {
    fields.push('replied_by=?');
    values.push(data.replied_by);
  }
  if (data.replied_at !== undefined) {
    fields.push('replied_at=?');
    values.push(data.replied_at);
  }

  if (fields.length === 0) return; // nothing to update

  const sql = `UPDATE rating SET ${fields.join(', ')} WHERE id=?`;
  values.push(id);
  await db.query(sql, values);
};

export const deleteRating = async (id) => {
  await db.query('DELETE FROM rating WHERE id=?', [id]);
};
