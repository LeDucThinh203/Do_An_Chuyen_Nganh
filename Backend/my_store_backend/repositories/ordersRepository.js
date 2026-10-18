import db from '../db.js';
import { resolveProductSizeStockColumn } from '../services/productSizeStock.js';
import { encodeCursor } from '../utils/pagination.js';

const attachOrderDetails = async (orders) => {
  if (!orders.length) return orders;
  const orderIds = orders.map((order) => order.id);
  const [details] = await db.query(`
    SELECT od.order_id, od.id AS order_detail_id, od.quantity, od.price,
           ps.id AS product_size_id, s.size AS size_name,
           p.id AS product_id, p.name AS product_name, p.price AS product_price, p.image
    FROM order_details od
    INNER JOIN product_sizes ps ON ps.id = od.product_sizes_id
    INNER JOIN sizes s ON s.id = ps.size_id
    INNER JOIN product p ON p.id = ps.product_id
    WHERE od.order_id = ANY(?)
    ORDER BY od.order_id, od.id
  `, [orderIds]);

  const detailsByOrderId = new Map();
  for (const detail of details) {
    const key = String(detail.order_id);
    if (!detailsByOrderId.has(key)) detailsByOrderId.set(key, []);
    detailsByOrderId.get(key).push(detail);
  }
  return orders.map((order) => ({
    ...order,
    order_details: detailsByOrderId.get(String(order.id)) || [],
  }));
};

export const getAllOrders = async () => {
  const [orders] = await db.query(
    `SELECT o.*, a.username AS account_username
     FROM orders o
     LEFT JOIN account a ON a.id = o.account_id
     ORDER BY o.created_at DESC, o.id DESC`
  );
  return attachOrderDetails(orders);
};

export const getOrdersPage = ({ limit = 25, cursor = null, accountId = null, from = null, to = null } = {}) => {
  const conditions = [];
  const values = [];
  if (accountId != null) {
    conditions.push('o.account_id = ?');
    values.push(accountId);
  }
  if (cursor?.createdAt && cursor?.id != null) {
    conditions.push('(o.created_at, o.id) < (?, ?)');
    values.push(cursor.createdAt, cursor.id);
  }
  if (from != null) {
    conditions.push('o.created_at >= ?');
    values.push(from);
  }
  if (to != null) {
    conditions.push('o.created_at < ?');
    values.push(to);
  }
  values.push(limit + 1);

  const [rows] = await db.query(
    `SELECT o.*, a.username AS account_username
     FROM orders o
     LEFT JOIN account a ON a.id = o.account_id
     ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
     ORDER BY o.created_at DESC, o.id DESC
     LIMIT ?`,
    values
  );

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const data = await attachOrderDetails(pageRows);
  const lastOrder = pageRows[pageRows.length - 1];
  const nextCursor = hasMore && lastOrder
    ? encodeCursor({ createdAt: lastOrder.created_at, id: lastOrder.id })
    : null;

  return { data, pagination: { limit, hasMore, nextCursor } };
};

export const getOrderById = async (id) => {
  const [orders] = await db.query(
    `SELECT o.*, a.username AS account_username
     FROM orders o
     LEFT JOIN account a ON a.id = o.account_id
     WHERE o.id = ?`,
    [id]
  );
  if (!orders[0]) return null;

  const [order] = await attachOrderDetails([orders[0]]);
  return order;
};

export const createOrder = async (orderData) => {
  const { name, phone, address, account_id, total_amount, payment_method, is_paid, order_details } = orderData;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const stockColumn = await resolveProductSizeStockColumn();

    const [result] = await conn.query(
      'INSERT INTO orders (name, phone, address, account_id, total_amount, payment_method, is_paid) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, phone, address, account_id || null, total_amount || 0, payment_method || 'cod', is_paid ? 1 : 0]
    );

    const orderId = result.insertId;

    if (order_details && order_details.length > 0) {
      // Kiểm tra và giảm stock cho từng sản phẩm
      for (const detail of order_details) {
        const { product_sizes_id, quantity } = detail;
        
        // Lấy stock hiện tại
        const [stockRows] = await conn.query(
          `SELECT ${stockColumn} AS stock FROM product_sizes WHERE id = ?`,
          [product_sizes_id]
        );
        
        if (!stockRows[0]) {
          throw new Error(`Product size ID ${product_sizes_id} không tồn tại`);
        }
        
        const currentStock = stockRows[0].stock;
        
        if (currentStock < quantity) {
          throw new Error(`Không đủ hàng trong kho. Còn lại: ${currentStock}, yêu cầu: ${quantity}`);
        }
        
        // Giảm stock
        await conn.query(
          `UPDATE product_sizes SET ${stockColumn} = ${stockColumn} - ? WHERE id = ?`,
          [quantity, product_sizes_id]
        );
      }
      
      // Insert order details (PostgreSQL-friendly, one statement per detail)
      for (const d of order_details) {
        await conn.query(
          'INSERT INTO order_details (order_id, product_sizes_id, quantity, price) VALUES (?, ?, ?, ?)',
          [orderId, d.product_sizes_id, d.quantity, d.price]
        );
      }
    }

    await conn.commit();
    return orderId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const updateOrderStatus = async (id, data) => {
  const { status, is_paid, payment_method, payment_info } = data;
  
  // Xây dựng câu query động dựa trên các trường có trong data
  const updateFields = [];
  const updateValues = [];
  
  if (status !== undefined) {
    updateFields.push('status = ?');
    updateValues.push(status);
  }
  
  if (is_paid !== undefined) {
    updateFields.push('is_paid = ?');
    updateValues.push(is_paid ? 1 : 0);
  }
  
  if (payment_method !== undefined) {
    updateFields.push('payment_method = ?');
    updateValues.push(payment_method);
  }
  
  if (payment_info !== undefined) {
    updateFields.push('payment_info = ?');
    updateValues.push(payment_info);
  }
  
  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }
  
  updateValues.push(id); // Thêm id vào cuối cho WHERE clause
  
  const query = `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`;
  await db.query(query, updateValues);
};

export const deleteOrder = async (id) => {
  await db.query('DELETE FROM orders WHERE id=?', [id]);
};
