import db from '../db.js';

let ensureDeletedAtColumnPromise = null;

const ensureDeletedAtColumn = async () => {
  if (!ensureDeletedAtColumnPromise) {
    ensureDeletedAtColumnPromise = (async () => {
      const [rows] = await db.query(
        `SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'product'
           AND column_name = 'deleted_at'
         LIMIT 1`
      );

      if (!rows?.length) {
        await db.query('ALTER TABLE product ADD COLUMN deleted_at TIMESTAMPTZ NULL');
      }
    })();
  }

  await ensureDeletedAtColumnPromise;
};

// Kiểm tra xem sản phẩm đã được mua hay chưa
const checkProductHasPurchases = async (productId) => {
  const sql = `
    SELECT COUNT(*) as purchase_count
    FROM order_details od
    WHERE od.product_sizes_id IN (
      SELECT id FROM product_sizes WHERE product_id = ?
    )
  `;
  const [result] = await db.query(sql, [productId]);
  return result[0]?.purchase_count > 0;
};

export const getAllProducts = async ({ includeDeleted = false } = {}) => {
  await ensureDeletedAtColumn();
  const sql = includeDeleted
    ? `SELECT p.*,
              EXISTS (
                SELECT 1
                FROM order_details od
                JOIN product_sizes ps ON ps.id = od.product_sizes_id
                WHERE ps.product_id = p.id
              ) AS hasPurchases
       FROM product p
       ORDER BY p.id DESC`
    : `SELECT p.*,
              EXISTS (
                SELECT 1
                FROM order_details od
                JOIN product_sizes ps ON ps.id = od.product_sizes_id
                WHERE ps.product_id = p.id
              ) AS hasPurchases
       FROM product p
       WHERE p.deleted_at IS NULL
       ORDER BY p.id DESC`;
  const [rows] = await db.query(sql);
  return rows;
};

export const getProductById = async (id, { includeDeleted = false } = {}) => {
  await ensureDeletedAtColumn();
  const sql = includeDeleted
    ? 'SELECT * FROM product WHERE id=?'
    : 'SELECT * FROM product WHERE id=? AND deleted_at IS NULL';
  const [rows] = await db.query(sql, [id]);
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
  await ensureDeletedAtColumn();
  const [rows] = await db.query('SELECT id, deleted_at FROM product WHERE id=?', [id]);
  if (!rows?.length) {
    const err = new Error('Sản phẩm không tồn tại');
    err.statusCode = 404;
    throw err;
  }

  if (rows[0].deleted_at) {
    const err = new Error('Sản phẩm đã được ẩn trước đó');
    err.statusCode = 409;
    throw err;
  }

  await db.query('UPDATE product SET deleted_at = NOW() WHERE id=?', [id]);
};

export const restoreProduct = async (id) => {
  await ensureDeletedAtColumn();
  const [rows] = await db.query('SELECT id, deleted_at FROM product WHERE id=?', [id]);
  if (!rows?.length) {
    const err = new Error('Sản phẩm không tồn tại');
    err.statusCode = 404;
    throw err;
  }

  if (!rows[0].deleted_at) {
    const err = new Error('Sản phẩm đang ở trạng thái hoạt động');
    err.statusCode = 409;
    throw err;
  }

  await db.query('UPDATE product SET deleted_at = NULL WHERE id=?', [id]);
};

// Xóa cứng sản phẩm (chỉ cho sản phẩm chưa được mua)
export const hardDeleteProduct = async (id) => {
  // Kiểm tra xem sản phẩm có đã được mua không
  const hasPurchases = await checkProductHasPurchases(id);
  if (hasPurchases) {
    const err = new Error('Không thể xóa sản phẩm đã được mua. Vui lòng sử dụng tính năng ẩn sản phẩm.');
    err.statusCode = 409;
    throw err;
  }

  // Xóa các size của sản phẩm trước (để tránh lỗi FK)
  await db.query('DELETE FROM product_sizes WHERE product_id=?', [id]);
  
  // Xóa sản phẩm
  await db.query('DELETE FROM product WHERE id=?', [id]);
};
