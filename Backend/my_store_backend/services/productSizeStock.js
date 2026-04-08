import db from '../db.js';

let stockColumnPromise;

export const resolveProductSizeStockColumn = async () => {
  if (stockColumnPromise) return stockColumnPromise;

  stockColumnPromise = (async () => {
    const [rows] = await db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'product_sizes'
        AND column_name IN ('stock', 'quantity', 'stock_quantity', 'warehouse')
      ORDER BY CASE column_name
        WHEN 'stock' THEN 1
        WHEN 'quantity' THEN 2
        WHEN 'stock_quantity' THEN 3
        WHEN 'warehouse' THEN 4
        ELSE 100
      END
      LIMIT 1
    `);

    if (!rows.length) {
      throw new Error('Bảng product_sizes chưa có cột tồn kho hợp lệ (stock/quantity/stock_quantity/warehouse)');
    }

    return rows[0].column_name;
  })();

  return stockColumnPromise;
};