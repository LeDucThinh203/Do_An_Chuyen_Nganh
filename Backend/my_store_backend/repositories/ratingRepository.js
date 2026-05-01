import db from '../db.js';

export const getAllRatings = async () => {
  const sql = `
    SELECT r.*, od.order_id as _order_id, o.account_id as _account_id, a.username as _username
    FROM rating r
    LEFT JOIN order_details od ON r.order_detail_id = od.id
    LEFT JOIN orders o ON od.order_id = o.id
    LEFT JOIN account a ON o.account_id = a.id
    ORDER BY r.id DESC
  `;
  const [rows] = await db.query(sql);
  // Normalize username field to `username` on each row for frontend convenience
  return rows.map(row => ({ ...row, username: row._username || null }));
};

export const getRatingById = async (id) => {
  const sql = `
    SELECT r.*, od.order_id as _order_id, o.account_id as _account_id, a.username as _username
    FROM rating r
    LEFT JOIN order_details od ON r.order_detail_id = od.id
    LEFT JOIN orders o ON od.order_id = o.id
    LEFT JOIN account a ON o.account_id = a.id
    WHERE r.id = ?
    LIMIT 1
  `;
  const [rows] = await db.query(sql, [id]);
  if (!rows[0]) return null;
  return { ...rows[0], username: rows[0]._username || null };
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
