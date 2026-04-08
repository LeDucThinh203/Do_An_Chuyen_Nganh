import db from '../../db.js';
import { semanticSearchProducts } from './vectorStore.js';
import { resolveProductSizeStockColumn } from '../productSizeStock.js';

// Tool declarations (for Gemini function calling)
export const toolDeclarations = [
  {
    name: 'search_products',
    description: 'BẮT BUỘC gọi tool này khi khách hỏi về sản phẩm! Tìm sản phẩm theo tên/mô tả với filter chính xác theo giá (sau giảm), size, danh mục. LUÔN gọi tool này thay vì chỉ dùng context products. Khi có khoảng giá (VD: "150-200k"), PHẢI truyền cả min_price và max_price.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Từ khóa người dùng' },
        limit: { type: 'NUMBER', description: 'Số lượng kết quả tối đa', nullable: true },
        min_price: { type: 'NUMBER', description: 'Giá tối thiểu (VND) - dùng khi khách hỏi "từ X đến Y" hoặc "X-Y"', nullable: true },
        max_price: { type: 'NUMBER', description: 'Giá tối đa (VND) - dùng khi khách hỏi "dưới X" hoặc "từ X đến Y" hoặc "X-Y"', nullable: true },
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
    name: 'get_recent_order',
    description: 'Lấy đơn hàng gần nhất của người dùng (để kiểm tra trước khi sửa/thêm sản phẩm)',
    parameters: {
      type: 'OBJECT',
      properties: {
        user_id: { type: 'NUMBER', description: 'ID người dùng' }
      },
      required: ['user_id']
    }
  },
  {
    name: 'update_order',
    description: 'Cập nhật đơn hàng đang CHỜ XÁC NHẬN (status=pending). Có thể thêm sản phẩm hoặc thay đổi địa chỉ. CHỈ dùng khi khách yêu cầu sửa đơn vừa tạo.',
    parameters: {
      type: 'OBJECT',
      properties: {
        order_id: { type: 'NUMBER', description: 'ID đơn hàng cần cập nhật' },
        action: { 
          type: 'STRING', 
          description: 'Hành động: "add_items" (thêm sản phẩm) hoặc "change_address" (đổi địa chỉ)',
          enum: ['add_items', 'change_address']
        },
        new_items: {
          type: 'ARRAY',
          description: 'Danh sách sản phẩm thêm vào (chỉ khi action=add_items)',
          items: {
            type: 'OBJECT',
            properties: {
              product_id: { type: 'NUMBER', description: 'ID sản phẩm' },
              size: { type: 'STRING', description: 'Size sản phẩm' },
              quantity: { type: 'NUMBER', description: 'Số lượng' }
            },
            required: ['product_id', 'size', 'quantity']
          },
          nullable: true
        },
        new_address_id: { 
          type: 'NUMBER', 
          description: 'ID địa chỉ mới (chỉ khi action=change_address)',
          nullable: true
        }
      },
      required: ['order_id', 'action']
    }
  },
  {
    name: 'get_current_date',
    description: 'Lấy ngày hiện tại (timezone Việt Nam UTC+7) để tính toán ngày cho các truy vấn. Gọi tool này khi cần biết ngày hôm nay để tính "hôm qua", "hôm kia", v.v.',
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: []
    }
  },
  {
    name: 'get_orders_by_date',
    description: 'Lọc đơn hàng của người dùng theo ngày đặt hàng. Hỗ trợ: "hôm nay" (date_type=today), "hôm qua" (yesterday), "hôm kia" (day_before_yesterday), "gần đây" (recent=15 ngày), hoặc ngày cụ thể (specific_date). Hiển thị TẤT CẢ đơn hàng trong ngày đó.',
    parameters: {
      type: 'OBJECT',
      properties: {
        user_id: { type: 'NUMBER', description: 'ID người dùng' },
        date_type: {
          type: 'STRING',
          description: 'Loại lọc theo ngày: "today" (hôm nay), "yesterday" (hôm qua), "day_before_yesterday" (hôm kia), "recent" (15 ngày gần đây), "specific" (ngày cụ thể)',
          enum: ['today', 'yesterday', 'day_before_yesterday', 'recent', 'specific']
        },
        specific_date: {
          type: 'STRING',
          description: 'Ngày cụ thể (YYYY-MM-DD) - chỉ dùng khi date_type="specific"',
          nullable: true
        },
        status: {
          type: 'STRING',
          description: 'Lọc theo trạng thái: pending, confirmed, shipping, delivered, cancelled',
          nullable: true
        }
      },
      required: ['user_id', 'date_type']
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
  async search_products({ query, limit = 5, min_price = null, max_price = null, size = null, category = null }) {
    console.log(`[Tool search_products] Called with query="${query}", limit=${limit}, min_price=${min_price}, max_price=${max_price}`);
    
    // OPTIMIZATION: Use semantic search with brand filtering instead of simple SQL
    // This ensures consistent behavior with initial RAG search
    const baseLimit = Math.min(Number(limit) || 5, 20);
    let results = await semanticSearchProducts(query, baseLimit);
    
    console.log(`[Tool search_products] semanticSearch returned ${results.length} products`);
    
    // Apply price filters (min_price and/or max_price) if specified
    if (min_price != null || max_price != null) {
      const minPriceNum = min_price != null ? Number(min_price) : 0;
      const maxPriceNum = max_price != null ? Number(max_price) : Infinity;
      console.log(`[Tool search_products] Filtering by price range: ${minPriceNum}đ - ${maxPriceNum}đ`);
      
      results = results.filter(p => {
        // Calculate actual price after discount
        const discount = p.discount_percent || 0;
        const finalPrice = discount > 0 
          ? Math.round(p.price * (100 - discount) / 100)
          : p.price;
        // Store finalPrice for sorting later
        p._finalPrice = finalPrice;
        const pass = finalPrice >= minPriceNum && finalPrice <= maxPriceNum;
        
        // DEBUG: Log ALL products being filtered
        console.log(`[Tool] ${pass ? '✓' : '✗'} "${p.name}": giá gốc ${p.price}đ → sau giảm ${finalPrice}đ (discount ${discount}%) | Range: ${minPriceNum}-${maxPriceNum}đ`);
        
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
    
    // FINAL STEP: Sort by price (if price filter was specified) and limit results
    if ((min_price != null || max_price != null) && results.length > 0) {
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
    
    // CRITICAL: Only suggest alternatives when NO products found at all
    // Don't suggest when products are found but don't match filters
    if (results.length === 0) {
      console.log(`[Tool search_products] No products found for query "${query}"`);
      
      // Build appropriate error message based on search criteria
      let notFoundMessage = '';
      
      if (min_price != null || max_price != null) {
        // Price filter case
        const rangeText = min_price != null && max_price != null 
          ? `${min_price.toLocaleString('vi-VN')}đ - ${max_price.toLocaleString('vi-VN')}đ`
          : max_price != null 
            ? `dưới ${max_price.toLocaleString('vi-VN')}đ`
            : `trên ${min_price.toLocaleString('vi-VN')}đ trở lên`;
        notFoundMessage = `Xin lỗi, shop không có sản phẩm "${query}" trong khoảng giá ${rangeText}.`;
      } else if (size) {
        // Size filter case
        notFoundMessage = `Xin lỗi, sản phẩm "${query}" không có size ${size} hoặc đã hết hàng.`;
      } else {
        // General case - product not found
        notFoundMessage = `Xin lỗi, shop không có sản phẩm "${query}" bạn tìm.`;
      }
      
      // ONLY suggest alternatives if this seems like a genuine product search
      // Don't suggest for very generic queries or when customer is just browsing
      const shouldSuggest = query && query.length > 2 && !query.match(/^(xem|tìm|có|shop)$/i);
      
      if (shouldSuggest) {
        console.log(`[Tool search_products] Searching for similar alternatives...`);
        
        // Try to find similar products (without strict filters)
        let alternatives = await semanticSearchProducts(query, 5);
        
        // If still no results, try broader search with just category keywords
        if (alternatives.length === 0) {
          // Extract category from query (áo, quần, giày, etc.)
          const categoryMatch = query.match(/\b(áo|ao|quần|quan|giày|giay|găng|gang|bóng|bong)\b/i);
          if (categoryMatch) {
            const categoryKeyword = categoryMatch[1];
            console.log(`[Tool search_products] Trying broader search with category: ${categoryKeyword}`);
            alternatives = await semanticSearchProducts(categoryKeyword, 5);
          }
        }
        
        if (alternatives.length > 0) {
          // Calculate final prices for alternatives
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
          const suggestions = alternatives.slice(0, 3);
          
          console.log(`[Tool search_products] Found ${suggestions.length} alternative suggestions`);
          suggestions.forEach(p => {
            console.log(`[Tool] Suggest: "${p.name}": ${p.price}đ → ${p._finalPrice}đ (giảm ${p.discount_percent || 0}%)`);
          });
          
          return {
            found: false,
            query: query,
            message: notFoundMessage,
            hasSuggestions: true,
            suggestions: suggestions
          };
        }
      }
      
      // No products found and no suggestions
      console.log(`[Tool search_products] No alternatives found`);
      return {
        found: false,
        query: query,
        message: notFoundMessage,
        hasSuggestions: false
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

  async get_current_date() {
    console.log('[Tool get_current_date] Getting current date in Vietnam timezone');
    
    try {
      // Get current date in Vietnam timezone (UTC+7)
      const now = new Date();
      const vietnamTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
      
      const year = vietnamTime.getFullYear();
      const month = String(vietnamTime.getMonth() + 1).padStart(2, '0');
      const day = String(vietnamTime.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      const dayOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][vietnamTime.getDay()];
      
      console.log(`[Tool get_current_date] Current date: ${dateString} (${dayOfWeek})`);
      
      return {
        success: true,
        current_date: dateString,
        day_of_week: dayOfWeek,
        timestamp: vietnamTime.toISOString()
      };
    } catch (error) {
      console.error('[Tool get_current_date] Error:', error);
      return { success: false, error: error.message };
    }
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

  async get_orders_by_date({ user_id, date_type, specific_date = null, status = null }) {
    console.log(`[Tool get_orders_by_date] user_id=${user_id}, date_type=${date_type}, specific_date=${specific_date}, status=${status}`);
    
    try {
      // Lấy ngày hiện tại theo timezone Việt Nam (UTC+7)
      const getCurrentVietnamDate = () => {
        const now = new Date();
        // Chuyển sang múi giờ Việt Nam
        const vietnamOffset = 7 * 60; // UTC+7 = 7 hours = 420 minutes
        const localOffset = now.getTimezoneOffset(); // Offset của server (âm nếu trước UTC)
        const vietnamTime = new Date(now.getTime() + (vietnamOffset + localOffset) * 60000);
        return vietnamTime;
      };

      const today = getCurrentVietnamDate();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      console.log(`[Tool get_orders_by_date] Current date (Vietnam): ${dateString} (${today.toISOString()})`);

      let startDate, endDate;
      let dateDescription = '';

      // Xác định khoảng thời gian dựa trên date_type
      switch (date_type) {
        case 'specific':
          if (!specific_date) {
            return { found: false, error: 'Vui lòng cung cấp ngày cụ thể (specific_date)' };
          }
          // Ngày cụ thể: từ 00:00:00 đến 23:59:59 của ngày đó (UTC+7)
          const specificVietnamDate = new Date(specific_date + 'T00:00:00+07:00');
          startDate = new Date(specificVietnamDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(specificVietnamDate);
          endDate.setHours(23, 59, 59, 999);
          dateDescription = `ngày ${specific_date}`;
          break;

        case 'today':
          // Hôm nay: từ 00:00:00 đến 23:59:59 hôm nay (theo giờ VN)
          startDate = new Date(today);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          dateDescription = 'hôm nay';
          break;

        case 'yesterday':
          // Hôm qua: ngày hiện tại - 1 (theo giờ VN)
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
          startDate = new Date(yesterday);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(yesterday);
          endDate.setHours(23, 59, 59, 999);
          dateDescription = 'hôm qua';
          break;

        case 'day_before_yesterday':
          // Hôm kia: ngày hiện tại - 2 (theo giờ VN)
          const dayBeforeYesterday = new Date(today);
          dayBeforeYesterday.setDate(today.getDate() - 2);
          startDate = new Date(dayBeforeYesterday);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(dayBeforeYesterday);
          endDate.setHours(23, 59, 59, 999);
          dateDescription = 'hôm kia';
          break;

        case 'recent':
          // Gần đây: 15 ngày gần nhất đến hôm nay (theo giờ VN)
          const recentStart = new Date(today);
          recentStart.setDate(today.getDate() - 15);
          startDate = new Date(recentStart);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          dateDescription = '15 ngày gần đây';
          break;

        default:
          return { found: false, error: 'date_type không hợp lệ' };
      }

      console.log(`[Tool get_orders_by_date] Date range: ${startDate.toISOString()} -> ${endDate.toISOString()}`);

      // Build query - lấy TẤT CẢ đơn hàng trong khoảng thời gian (không filter theo status)
      const query = `SELECT o.*, 
                    (SELECT COUNT(*) FROM order_details WHERE order_id = o.id) as item_count,
                    (SELECT GROUP_CONCAT(CONCAT(p.name, ' (', s.size, ') x', od.quantity) SEPARATOR ', ')
                     FROM order_details od
                     LEFT JOIN product_sizes ps ON od.product_sizes_id = ps.id
                     LEFT JOIN product p ON ps.product_id = p.id
                     LEFT JOIN sizes s ON ps.size_id = s.id
                     WHERE od.order_id = o.id) as items_summary
                   FROM orders o
                   WHERE o.account_id = ?
                   AND o.created_at >= ? AND o.created_at <= ?
                   ORDER BY o.created_at DESC`;
      
      const params = [user_id, startDate, endDate];
      
      const [orders] = await db.query(query, params);
      
      if (orders.length === 0) {
        console.log(`[Tool get_orders_by_date] No orders found for ${dateDescription}`);
        return { 
          found: false, 
          message: `Không tìm thấy đơn hàng ${dateDescription}`,
          status_filter: status // Trả về status để AI biết khách hỏi về trạng thái gì
        };
      }
      
      console.log(`[Tool get_orders_by_date] Found ${orders.length} orders for ${dateDescription}`);
      return { 
        found: true, 
        orders: orders,
        count: orders.length,
        date_description: dateDescription,
        status_filter: status // Trả về status để AI có thể lọc và trả lời đúng
      };
      
    } catch (error) {
      console.error('[Tool get_orders_by_date] Error:', error);
      return { found: false, error: `Lỗi khi tìm đơn hàng: ${error.message}` };
    }
  },

  async create_order({ user_id, items, address_id = null, shipping_address = null, payment_method = 'COD' }) {
    console.log(`[Tool create_order] Creating order for user ${user_id} with ${items.length} items`);
    
    try {
      const stockColumn = await resolveProductSizeStockColumn();

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
          `SELECT ps.id, ps.${stockColumn} AS stock, s.size 
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
          `UPDATE product_sizes SET ${stockColumn} = ${stockColumn} - ? WHERE id = ?`,
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
  },

  async get_recent_order({ user_id }) {
    console.log(`[Tool get_recent_order] Getting most recent order for user ${user_id}`);
    
    try {
      // Get most recent order that is still pending
      const [[order]] = await db.query(
        `SELECT id, account_id, name, phone, address, total_amount, status, payment_method, created_at
         FROM orders 
         WHERE account_id = ? AND status = 'pending'
         ORDER BY created_at DESC 
         LIMIT 1`,
        [user_id]
      );
      
      if (!order) {
        return { found: false, message: 'Không tìm thấy đơn hàng đang chờ xác nhận' };
      }
      
      // Get order items
      const [items] = await db.query(
        `SELECT od.id, od.quantity, od.price, p.name as product_name, p.id as product_id, s.size
         FROM order_details od
         LEFT JOIN product_sizes ps ON od.product_sizes_id = ps.id
         LEFT JOIN product p ON ps.product_id = p.id
         LEFT JOIN sizes s ON ps.size_id = s.id
         WHERE od.order_id=?`,
        [order.id]
      );
      
      console.log(`[Tool get_recent_order] Found order #${order.id} with ${items.length} items`);
      
      return { 
        found: true, 
        order: {
          ...order,
          items
        }
      };
    } catch (error) {
      console.error('[Tool get_recent_order] Error:', error);
      return { found: false, error: error.message };
    }
  },

  async update_order({ order_id, action, new_items = null, new_address_id = null }) {
    console.log(`[Tool update_order] Updating order ${order_id}, action: ${action}`);
    
    try {
      const stockColumn = await resolveProductSizeStockColumn();

      // Verify order exists and is still pending
      const [[order]] = await db.query(
        'SELECT id, account_id, status FROM orders WHERE id = ?',
        [order_id]
      );
      
      if (!order) {
        return { success: false, error: `Đơn hàng #${order_id} không tồn tại.` };
      }
      
      if (order.status !== 'pending') {
        return { success: false, error: `Đơn hàng #${order_id} đã ${order.status}, không thể sửa.` };
      }
      
      if (action === 'add_items' && new_items && new_items.length > 0) {
        console.log(`[Tool update_order] Adding ${new_items.length} items to order ${order_id}`);
        
        let additionalTotal = 0;
        const addedItems = [];
        
        for (const item of new_items) {
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
            `SELECT ps.id, ps.${stockColumn} AS stock, s.size 
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
          
          // Calculate price
          const finalPrice = product.discount_percent > 0
            ? Math.round(product.price * (100 - product.discount_percent) / 100)
            : product.price;
          
          const itemTotal = finalPrice * item.quantity;
          additionalTotal += itemTotal;
          
          // Add to order_details
          await db.query(
            `INSERT INTO order_details (order_id, product_sizes_id, quantity, price) 
             VALUES (?, ?, ?, ?)`,
            [order_id, sizeInfo.id, item.quantity, finalPrice]
          );
          
          // Update stock
          await db.query(
            `UPDATE product_sizes SET ${stockColumn} = ${stockColumn} - ? WHERE id = ?`,
            [item.quantity, sizeInfo.id]
          );
          
          addedItems.push({
            product_name: product.name,
            size: item.size,
            quantity: item.quantity,
            unit_price: finalPrice,
            total: itemTotal
          });
          
          console.log(`[Tool update_order] Added: ${product.name} (${item.size}) x${item.quantity} = ${itemTotal}đ`);
        }
        
        // Update order total
        await db.query(
          'UPDATE orders SET total_amount = total_amount + ? WHERE id = ?',
          [additionalTotal, order_id]
        );
        
        // Get updated order
        const [[updatedOrder]] = await db.query(
          'SELECT total_amount FROM orders WHERE id = ?',
          [order_id]
        );
        
        console.log(`[Tool update_order] Order ${order_id} updated successfully, new total: ${updatedOrder.total_amount}đ`);
        
        return {
          success: true,
          order_id,
          added_items: addedItems,
          additional_amount: additionalTotal,
          new_total: updatedOrder.total_amount,
          message: `Đã thêm ${new_items.length} sản phẩm vào đơn hàng #${order_id}. Tổng tiền mới: ${updatedOrder.total_amount.toLocaleString('vi-VN')}đ`
        };
        
      } else if (action === 'change_address' && new_address_id) {
        console.log(`[Tool update_order] Changing address for order ${order_id} to address ${new_address_id}`);
        
        // Get new address info
        const [[addr]] = await db.query(
          'SELECT name, phone, provinceName, districtName, wardName, address_detail FROM address WHERE id = ?',
          [new_address_id]
        );
        
        if (!addr) {
          return { success: false, error: `Địa chỉ ID ${new_address_id} không tồn tại.` };
        }
        
        const fullAddress = `${addr.address_detail}, ${addr.wardName}, ${addr.districtName}, ${addr.provinceName}`;
        
        // Update order
        await db.query(
          'UPDATE orders SET name = ?, phone = ?, address = ? WHERE id = ?',
          [addr.name, addr.phone, fullAddress, order_id]
        );
        
        console.log(`[Tool update_order] Address updated for order ${order_id}`);
        
        return {
          success: true,
          order_id,
          new_address: fullAddress,
          message: `Đã cập nhật địa chỉ giao hàng cho đơn #${order_id}`
        };
        
      } else {
        return { success: false, error: 'Hành động không hợp lệ hoặc thiếu thông tin' };
      }
      
    } catch (error) {
      console.error('[Tool update_order] Error:', error);
      return { success: false, error: `Lỗi khi cập nhật đơn hàng: ${error.message}` };
    }
  }
};
