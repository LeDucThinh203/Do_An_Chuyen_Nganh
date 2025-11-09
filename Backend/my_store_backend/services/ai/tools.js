import db from '../../db.js';
import { normalizeImage } from './vectorStore.js';

// Tool declarations (for Gemini function calling)
export const toolDeclarations = [
  {
    name: 'search_products',
    description: 'Tìm sản phẩm theo tên/mô tả, có thể kèm bộ lọc giá tối đa, size và danh mục.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Từ khóa người dùng' },
        limit: { type: 'NUMBER', description: 'Số lượng kết quả tối đa', nullable: true },
        max_price: { type: 'NUMBER', description: 'Giá tối đa (VND)', nullable: true },
        size: { type: 'STRING', description: 'Kích cỡ như S/M/L/39/40/41...', nullable: true },
        category: { type: 'STRING', description: 'Tên danh mục, ví dụ: Giày, Áo, Quần...', nullable: true }
      },
      required: ['query']
    }
  },
  {
    name: 'get_order_status',
    description: 'Xem trạng thái đơn hàng theo ID',
    parameters: {
      type: 'OBJECT',
      properties: {
        order_id: { type: 'NUMBER', description: 'ID đơn hàng' },
      },
      required: ['order_id']
    }
  },
  {
    name: 'list_orders_for_user',
    description: 'Liệt kê các đơn hàng của một người dùng',
    parameters: {
      type: 'OBJECT',
      properties: {
        user_id: { type: 'NUMBER', description: 'ID tài khoản người dùng' },
        limit: { type: 'NUMBER', description: 'Giới hạn số đơn', nullable: true }
      },
      required: ['user_id']
    }
  }
];

// Tool implementations
export const toolsImpl = {
  async search_products({ query, limit = 5, max_price = null, size = null, category = null }) {
    // Heuristic category detection if not provided
    const qText = String(query || '').toLowerCase();
    const inferredCategory = !category && (qText.includes('giày') || qText.includes('giay')) ? 'Giày' : null;
    const activeCategory = category || inferredCategory;

    // OPTIMIZATION: Single optimized query with all filters
    const where = [
      '(p.name LIKE CONCAT("%", ?, "%") OR p.description LIKE CONCAT("%", ?, "%"))'
    ];
    const params = [query || '', query || ''];
    
    if (max_price != null) { 
      where.push('p.price <= ?'); 
      params.push(Number(max_price)); 
    }
    if (size) { 
      where.push('s.size = ?'); 
      params.push(String(size)); 
    }
    if (activeCategory) { 
      where.push('c.name LIKE CONCAT("%", ?, "%")'); 
      params.push(String(activeCategory)); 
    }

    const maxCount = Math.min(Number(limit) || 5, 20); // Cap at 20 for performance

    // Primary search
    const sql = `
      SELECT DISTINCT p.id, p.name, p.description, p.price, p.image
      FROM product p
      LEFT JOIN product_sizes ps ON ps.product_id = p.id
      LEFT JOIN sizes s ON s.id = ps.size_id
      LEFT JOIN category c ON c.id = p.category_id
      WHERE ${where.join(' AND ')}
      ORDER BY p.price ASC
      LIMIT ?`;
    
    const [rows] = await db.query(sql, [...params, maxCount]);
    
    // If we got enough results, return immediately
    if (rows && rows.length >= Math.min(maxCount, 3)) {
      return rows.map(r => ({ ...r, image: normalizeImage(r.image), suggestion_type: 'exact' }));
    }

    // Fallback: relaxed search (remove price filter if present)
    if (max_price != null && rows.length < maxCount) {
      const relaxedWhere = where.filter(w => !w.includes('p.price'));
      const relaxedParams = params.filter((_, i) => where[i] !== 'p.price <= ?');
      
      const [fallback] = await db.query(
        `SELECT DISTINCT p.id, p.name, p.description, p.price, p.image
         FROM product p
         LEFT JOIN product_sizes ps ON ps.product_id = p.id
         LEFT JOIN sizes s ON s.id = ps.size_id
         LEFT JOIN category c ON c.id = p.category_id
         WHERE ${relaxedWhere.join(' AND ')}
         ORDER BY p.price ASC
         LIMIT ?`,
        [...relaxedParams, maxCount - rows.length]
      );
      
      const combined = [...rows, ...(fallback || [])];
      // Remove duplicates
      const unique = Array.from(new Map(combined.map(p => [p.id, p])).values());
      return unique.slice(0, maxCount).map(r => ({ ...r, image: normalizeImage(r.image), suggestion_type: r.id < rows.length ? 'exact' : 'relaxed' }));
    }

    return rows.map(r => ({ ...r, image: normalizeImage(r.image), suggestion_type: 'exact' }));
  },

  async get_order_status({ order_id }) {
    const [[order]] = await db.query(`SELECT * FROM orders WHERE id=?`, [order_id]);
    if (!order) return { error: 'Order not found' };
    const [items] = await db.query(
      `SELECT od.quantity, od.price, p.name as product_name, s.size
       FROM order_details od
       LEFT JOIN product_sizes ps ON od.product_sizes_id = ps.id
       LEFT JOIN product p ON ps.product_id = p.id
       LEFT JOIN sizes s ON ps.size_id = s.id
       WHERE od.order_id=?`, [order_id]
    );
    return { ...order, items };
  },

  async list_orders_for_user({ user_id, limit = 10 }) {
    const [rows] = await db.query(
      `SELECT * FROM orders WHERE account_id=? ORDER BY id DESC LIMIT ?`,
      [user_id, limit]
    );
    return rows;
  }
};
