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
  },
  {
    name: 'get_user_addresses',
    description: 'Lấy danh sách địa chỉ đã lưu của người dùng',
    parameters: {
      type: 'OBJECT',
      properties: {
        user_id: { type: 'NUMBER', description: 'ID tài khoản người dùng' }
      },
      required: ['user_id']
    }
  },
  {
    name: 'create_order',
    description: 'Tạo đơn hàng mới cho khách hàng. Yêu cầu khách đã đăng nhập (có user_id). Cần thông tin: sản phẩm (product_id, size, quantity), địa chỉ giao hàng.',
    parameters: {
      type: 'OBJECT',
      properties: {
        user_id: { type: 'NUMBER', description: 'ID người dùng' },
        items: { 
          type: 'ARRAY',
          description: 'Danh sách sản phẩm đặt mua',
          items: {
            type: 'OBJECT',
            properties: {
              product_id: { type: 'NUMBER', description: 'ID sản phẩm' },
              size: { type: 'STRING', description: 'Size sản phẩm (S/M/L/XL...)' },
              quantity: { type: 'NUMBER', description: 'Số lượng' }
            },
            required: ['product_id', 'size', 'quantity']
          }
        },
        address_id: { type: 'NUMBER', description: 'ID địa chỉ giao hàng (nếu có)', nullable: true },
        shipping_address: {
          type: 'OBJECT',
          description: 'Địa chỉ giao hàng mới (nếu không dùng address_id)',
          properties: {
            name: { type: 'STRING', description: 'Tên người nhận' },
            phone: { type: 'STRING', description: 'Số điện thoại' },
            provinceName: { type: 'STRING', description: 'Tên tỉnh/thành phố' },
            districtName: { type: 'STRING', description: 'Tên quận/huyện' },
            wardName: { type: 'STRING', description: 'Tên phường/xã' },
            address_detail: { type: 'STRING', description: 'Địa chỉ chi tiết' }
          },
          nullable: true
        },
        payment_method: { type: 'STRING', description: 'Phương thức thanh toán: COD hoặc VNPAY', nullable: true }
      },
      required: ['user_id', 'items']
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
      results = results.filter(p => {
        // Calculate actual price after discount
        const discount = p.discount_percent || 0;
        const finalPrice = discount > 0 
          ? Math.round(p.price * (100 - discount) / 100)
          : p.price;
        // Store finalPrice for sorting later
        p._finalPrice = finalPrice;
        const pass = finalPrice <= Number(max_price);
        if (pass) {
          console.log(`[Tool] ✓ "${p.name}": ${p.price}đ → ${finalPrice}đ (giảm ${discount}%)`);
        }
        return pass;
      });
      console.log(`[Tool search_products] ${results.length} products passed price filter`);
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
    
    // FINAL STEP: Sort by price (if max_price was specified) and limit results
    if (max_price != null && results.length > 0) {
      // Sort by final price (cheapest first) and discount (highest first)
      results.sort((a, b) => {
        const priceA = a._finalPrice || a.price;
        const priceB = b._finalPrice || b.price;
        const priceDiff = priceA - priceB;
        if (priceDiff !== 0) return priceDiff; // Cheaper first
        // If same price, prefer higher discount
        return (b.discount_percent || 0) - (a.discount_percent || 0);
      });
      
      // Limit to top 5 best deals to keep response fast and focused
      if (results.length > 5) {
        console.log(`[Tool search_products] Limiting to top 5 cheapest products (from ${results.length})`);
        results = results.slice(0, 5);
      }
    }
    
    // IMPORTANT: If no products found within price range, suggest cheapest alternatives
    if (max_price != null && results.length === 0) {
      console.log(`[Tool search_products] No products found under ${max_price}đ, searching for cheapest alternatives...`);
      
      // Re-run search WITHOUT price filter to find cheapest products in same category
      let alternatives = await semanticSearchProducts(query, 5);
      
      // Calculate final prices for all alternatives
      alternatives = alternatives.map(p => {
        const discount = p.discount_percent || 0;
        const finalPrice = discount > 0 
          ? Math.round(p.price * (100 - discount) / 100)
          : p.price;
        p._finalPrice = finalPrice;
        return p;
      });
      
      // Sort by price and take top 3 cheapest
      alternatives.sort((a, b) => a._finalPrice - b._finalPrice);
      const cheapest = alternatives.slice(0, 3);
      
      console.log(`[Tool search_products] Found ${cheapest.length} cheaper alternatives`);
      cheapest.forEach(p => {
        console.log(`[Tool] Suggest: "${p.name}": ${p.price}đ → ${p._finalPrice}đ (giảm ${p.discount_percent || 0}%)`);
      });
      
      // Return special response indicating no match but with suggestions
      return {
        found: false,
        requestedMaxPrice: max_price,
        message: `Xin lỗi, hiện tại shop không có sản phẩm dưới ${max_price.toLocaleString('vi-VN')}đ. Dưới đây là các sản phẩm rẻ nhất cùng loại:`,
        suggestions: cheapest
      };
    }
    
    console.log(`[Tool search_products] Returning ${results.length} products after filtering`);
    return results;
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
  },

  async get_user_addresses({ user_id }) {
    console.log(`[Tool get_user_addresses] Getting addresses for user ${user_id}`);
    const [rows] = await db.query(
      `SELECT id, name, phone, provinceName, districtName, wardName, address_detail 
       FROM address WHERE account_id=? ORDER BY id DESC`,
      [user_id]
    );
    
    if (rows.length === 0) {
      console.log(`[Tool get_user_addresses] No saved addresses found`);
      return { found: false, message: 'Người dùng chưa có địa chỉ đã lưu' };
    }
    
    console.log(`[Tool get_user_addresses] Found ${rows.length} saved addresses`);
    return { found: true, addresses: rows };
  },

  async create_order({ user_id, items, address_id = null, shipping_address = null, payment_method = 'COD' }) {
    console.log(`[Tool create_order] Creating order for user ${user_id} with ${items.length} items`);
    
    try {
      // Validate user exists
      const [[user]] = await db.query('SELECT id FROM account WHERE id = ?', [user_id]);
      if (!user) {
        return { success: false, error: 'Người dùng không tồn tại. Vui lòng đăng nhập.' };
      }

      // Get or create address info
      let addressName = '';
      let addressPhone = '';
      let fullAddress = '';
      
      if (address_id) {
        // Get existing address
        const [[addr]] = await db.query(
          'SELECT name, phone, provinceName, districtName, wardName, address_detail FROM address WHERE id = ?',
          [address_id]
        );
        if (addr) {
          addressName = addr.name;
          addressPhone = addr.phone;
          fullAddress = `${addr.address_detail}, ${addr.wardName}, ${addr.districtName}, ${addr.provinceName}`;
        }
      } else if (shipping_address) {
        // Use new address info
        addressName = shipping_address.receiver_name || shipping_address.name || 'Khách hàng';
        addressPhone = shipping_address.phone || '';
        const province = shipping_address.city || shipping_address.provinceName || '';
        const district = shipping_address.district || shipping_address.districtName || '';
        const ward = shipping_address.ward || shipping_address.wardName || '';
        const detail = shipping_address.detail_address || shipping_address.address_detail || '';
        fullAddress = `${detail}, ${ward}, ${district}, ${province}`.replace(/(, )+/g, ', ').replace(/^, |, $/g, '');
        
        // Also save to address table for future use
        try {
          await db.query(
            `INSERT INTO address (account_id, name, phone, provinceName, districtName, wardName, address_detail) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user_id, addressName, addressPhone, province, district, ward, detail]
          );
        } catch (e) {
          console.warn('[Tool create_order] Failed to save address:', e.message);
        }
      } else {
        // Try to get default address
        const [[defaultAddr]] = await db.query(
          'SELECT name, phone, provinceName, districtName, wardName, address_detail FROM address WHERE account_id = ? LIMIT 1',
          [user_id]
        );
        if (defaultAddr) {
          addressName = defaultAddr.name;
          addressPhone = defaultAddr.phone;
          fullAddress = `${defaultAddr.address_detail}, ${defaultAddr.wardName}, ${defaultAddr.districtName}, ${defaultAddr.provinceName}`;
        } else {
          return { success: false, error: 'Vui lòng cung cấp địa chỉ giao hàng.' };
        }
      }

      // Calculate total price and validate products
      let totalPrice = 0;
      const orderItems = [];

      for (const item of items) {
        // Get product info
        const [[product]] = await db.query(
          'SELECT id, name, price, discount_percent FROM product WHERE id = ?',
          [item.product_id]
        );
        
        if (!product) {
          return { success: false, error: `Sản phẩm ID ${item.product_id} không tồn tại.` };
        }

        // Get size and check stock
        const [[sizeInfo]] = await db.query(
          `SELECT ps.id, ps.stock, s.size 
           FROM product_sizes ps 
           JOIN sizes s ON s.id = ps.size_id 
           WHERE ps.product_id = ? AND s.size = ?`,
          [item.product_id, item.size]
        );

        if (!sizeInfo) {
          return { success: false, error: `Sản phẩm "${product.name}" không có size ${item.size}.` };
        }

        if (sizeInfo.stock < item.quantity) {
          return { success: false, error: `Sản phẩm "${product.name}" size ${item.size} chỉ còn ${sizeInfo.stock} sản phẩm.` };
        }

        // Calculate price after discount
        const finalPrice = product.discount_percent > 0
          ? Math.round(product.price * (100 - product.discount_percent) / 100)
          : product.price;

        const itemTotal = finalPrice * item.quantity;
        totalPrice += itemTotal;

        orderItems.push({
          product_sizes_id: sizeInfo.id,
          product_name: product.name,
          size: item.size,
          quantity: item.quantity,
          unit_price: finalPrice,
          total: itemTotal
        });

        console.log(`[Tool create_order] Item: ${product.name} (${item.size}) x${item.quantity} = ${itemTotal}đ`);
      }

      // Create order
      const orderDate = new Date();
      const [orderResult] = await db.query(
        `INSERT INTO orders (account_id, name, phone, address, total_amount, status, payment_method, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, addressName, addressPhone, fullAddress, totalPrice, 'pending', payment_method.toLowerCase(), orderDate]
      );

      const orderId = orderResult.insertId;
      console.log(`[Tool create_order] Created order ID: ${orderId}, Total: ${totalPrice}đ`);

      // Create order details and update stock
      for (const item of orderItems) {
        // Insert order detail
        await db.query(
          `INSERT INTO order_details (order_id, product_sizes_id, quantity, price) 
           VALUES (?, ?, ?, ?)`,
          [orderId, item.product_sizes_id, item.quantity, item.unit_price]
        );

        // Update stock
        await db.query(
          'UPDATE product_sizes SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.product_sizes_id]
        );
      }

      console.log(`[Tool create_order] Order created successfully!`);

      return {
        success: true,
        order_id: orderId,
        total_price: totalPrice,
        items: orderItems,
        payment_method,
        status: 'Chờ xử lý',
        message: `Đơn hàng #${orderId} đã được tạo thành công! Tổng tiền: ${totalPrice.toLocaleString('vi-VN')}đ. Phương thức thanh toán: ${payment_method}.`
      };

    } catch (error) {
      console.error('[Tool create_order] Error:', error);
      return { success: false, error: `Lỗi khi tạo đơn hàng: ${error.message}` };
    }
  }
};
