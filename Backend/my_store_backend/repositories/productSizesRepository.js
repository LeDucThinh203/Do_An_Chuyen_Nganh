import db from '../db.js';

let stockColumnPromise;

const resolveStockColumn = async () => {
  if (stockColumnPromise) return stockColumnPromise;

  stockColumnPromise = (async () => {
    const [rows] = await db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'product_sizes'
        AND column_name IN ('stock', 'quantity', 'stock_quantity', 'warehouse')
      ORDER BY FIELD(column_name, 'stock', 'quantity', 'stock_quantity', 'warehouse')
      LIMIT 1
    `);

    if (!rows.length) {
      throw new Error('Bảng product_sizes chưa có cột tồn kho hợp lệ (stock/quantity/stock_quantity/warehouse)');
    }

    return rows[0].column_name;
  })();

  return stockColumnPromise;
};

const getStockInput = (data = {}) => {
  if (data.stock !== undefined) return data.stock;
  if (data.quantity !== undefined) return data.quantity;
  if (data.stock_quantity !== undefined) return data.stock_quantity;
  if (data.warehouse !== undefined) return data.warehouse;
  return undefined;
};

export const getAllProductSizes = async () => {
  const stockColumn = await resolveStockColumn();
  const [rows] = await db.query(
    `SELECT id, product_id, size_id, ${stockColumn} AS stock FROM product_sizes`
  );
  return rows;
};

export const getProductSizeById = async (id) => {
  const stockColumn = await resolveStockColumn();
  const [rows] = await db.query(
    `SELECT id, product_id, size_id, ${stockColumn} AS stock FROM product_sizes WHERE id=?`,
    [id]
  );
  return rows[0] || null;
};

export const createProductSize = async (data) => {
  const stockColumn = await resolveStockColumn();
  const stockValue = Number(getStockInput(data) ?? 0);
  const product_id = data?.product_id;
  const size_id = data?.size_id;

  const [result] = await db.query(
    `INSERT INTO product_sizes (product_id, size_id, ${stockColumn}) VALUES (?, ?, ?)`,
    [product_id, size_id, stockValue]
  );
  return result.insertId;
};

export const updateProductSize = async (id, data) => {
  const stockColumn = await resolveStockColumn();
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

  const stockInput = getStockInput(data);
  if (stockInput !== undefined) {
    fields.push(`${stockColumn}=?`);
    values.push(stockInput);
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
