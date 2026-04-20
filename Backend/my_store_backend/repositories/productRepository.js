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

export const getAllProducts = async ({ includeDeleted = false } = {}) => {
  await ensureDeletedAtColumn();
  const sql = includeDeleted
    ? 'SELECT * FROM product ORDER BY id DESC'
    : 'SELECT * FROM product WHERE deleted_at IS NULL ORDER BY id DESC';
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
