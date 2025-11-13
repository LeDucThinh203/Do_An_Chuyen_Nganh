import db from '../../db.js';
import { semanticSearchProducts } from './vectorStore.js';

// Tool declarations (for Gemini function calling)
export const toolDeclarations = [
  {
    name: 'search_products',
    description: 'Tìm sản phẩm theo tên/mô tả, trả về thông tin đầy đủ bao gồm giá, khuyến mãi (discount_percent), số lượng tồn kho (stock) theo từng size. Có thể kèm bộ lọc giá tối đa, size và danh mục.',
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
    console.log(`[Tool search_products] Called with query="${query}", limit=${limit}`);
    
    // OPTIMIZATION: Use semantic search with brand filtering instead of simple SQL
    // This ensures consistent behavior with initial RAG search
    const baseLimit = Math.min(Number(limit) || 5, 20);
    let results = await semanticSearchProducts(query, baseLimit);
    
    console.log(`[Tool search_products] semanticSearch returned ${results.length} products`);
    
    // Apply additional filters (price, size, category) if specified
    if (max_price != null) {
      console.log(`[Tool search_products] Filtering by max_price: ${max_price}`);
      results = results.filter(p => p.price <= Number(max_price));
    }
    
    if (size) {
      console.log(`[Tool search_products] Filtering by size: ${size}`);
      const productIds = results.map(p => p.id);
      if (productIds.length > 0) {
        const placeholders = productIds.map(() => '?').join(',');
        const [withSize] = await db.query(
          `SELECT DISTINCT p.id FROM product p
           JOIN product_sizes ps ON ps.product_id = p.id
           JOIN sizes s ON s.id = ps.size_id
           WHERE p.id IN (${placeholders}) AND s.size = ?`,
          [...productIds, String(size)]
        );
        const sizeFilteredIds = new Set(withSize.map(r => r.id));
        results = results.filter(p => sizeFilteredIds.has(p.id));
      } else {
        results = [];
      }
    }
    
    if (category) {
      console.log(`[Tool search_products] Filtering by category: ${category}`);
      // Category filter already handled by semanticSearch, but double-check
      const categoryLower = String(category).toLowerCase();
      results = results.filter(p => {
        // Check if product has category info
        const prodName = (p.name || '').toLowerCase();
        const prodDesc = (p.description || '').toLowerCase();
        return prodName.includes(categoryLower) || prodDesc.includes(categoryLower);
      });
    }
    
    console.log(`[Tool search_products] Returning ${results.length} products after filtering`);
    return results.slice(0, baseLimit);
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
