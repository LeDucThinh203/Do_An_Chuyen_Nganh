import db from '../db.js';
import { encodeCursor } from '../utils/pagination.js';

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

export const getProductRatingsPage = async (productId, { limit = 20, cursor = null } = {}) => {
  const values = [productId];
  let cursorCondition = '';
  if (cursor?.id != null && Number.isInteger(Number(cursor.id))) {
    cursorCondition = 'AND r.id < ?';
    values.push(cursor.id);
  }
  values.push(limit + 1);

  const [pageResult, summaryResult] = await Promise.all([
    db.query(
      `SELECT r.*, COALESCE(a.username, 'Khách hàng CoolShop') AS username
       FROM rating r
       INNER JOIN order_details od ON od.id = r.order_detail_id
       INNER JOIN product_sizes ps ON ps.id = od.product_sizes_id
       INNER JOIN orders o ON o.id = od.order_id
       LEFT JOIN account a ON a.id = o.account_id
       WHERE ps.product_id = ? ${cursorCondition}
       ORDER BY r.id DESC
       LIMIT ?`,
      values
    ),
    cursor ? Promise.resolve([[], null]) : db.query(
      `SELECT COUNT(*)::integer AS total, COALESCE(AVG(r.rating_value), 0) AS average
       FROM rating r
       INNER JOIN order_details od ON od.id = r.order_detail_id
       INNER JOIN product_sizes ps ON ps.id = od.product_sizes_id
       WHERE ps.product_id = ?`,
      [productId]
    ),
  ]);
  const [rows] = pageResult;
  const [summaryRows] = summaryResult;

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore && data.length ? encodeCursor({ id: data[data.length - 1].id }) : null;
  const summary = summaryRows[0] || null;
  return {
    data,
    summary: summary ? { total: Number(summary.total), average: Number(summary.average) } : null,
    pagination: { limit, hasMore, nextCursor },
  };
};

export const getEligibleOrderDetailId = async (productId, accountId) => {
  const [rows] = await db.query(
    `SELECT od.id
     FROM order_details od
     INNER JOIN orders o ON o.id = od.order_id
     INNER JOIN product_sizes ps ON ps.id = od.product_sizes_id
     WHERE o.account_id = ?
       AND ps.product_id = ?
       AND NOT EXISTS (
         SELECT 1 FROM rating r WHERE r.order_detail_id = od.id
       )
     ORDER BY od.id DESC
     LIMIT 1`,
    [accountId, productId]
  );
  return rows[0]?.id ?? null;
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
