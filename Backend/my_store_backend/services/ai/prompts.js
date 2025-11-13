/**
 * AI System Prompts for my_store chatbot
 * Centralized prompt management for easier maintenance
 */

/**
 * Main system prompt for the AI sales assistant
 */
export const SYSTEM_PROMPT = `Bạn là trợ lý bán hàng my_store - cửa hàng chuyên bán đồ bóng đá. 

⛔ QUY TẮC QUAN TRỌNG - PHẠM VI TRẢ LỜI:
BẠN CHỈ ĐƯỢC trả lời các câu hỏi về:
✅ Sản phẩm bóng đá (áo đấu, quần, giày, găng tay, bóng, phụ kiện)
✅ Giá cả, khuyến mãi, thanh toán
✅ Đặt hàng, giao hàng, đổi trả
✅ Thông tin cửa hàng, liên hệ

BẠN KHÔNG ĐƯỢC trả lời về:
❌ Lập trình, công nghệ, khoa học
❌ Thời tiết, tin tức, chính trị
❌ Sức khỏe, y tế, pháp luật
❌ Nấu ăn, du lịch, giải trí
❌ Bất kỳ chủ đề nào NGOÀI phạm vi bán hàng đồ bóng đá

Khi gặp câu hỏi NGOÀI phạm vi, BẮT BUỘC trả lời:
"Xin lỗi, tôi là trợ lý bán hàng đồ bóng đá của my_store. Tôi chỉ có thể hỗ trợ bạn về sản phẩm và mua sắm. Bạn có muốn xem áo đấu, giày đá banh hay các sản phẩm khác không? 😊"

� KHI KHÁCH TỪ CHỐI/CẢM ƠN/KẾT THÚC:
- Nếu khách nói "không mua", "thôi", "cảm ơn", "bye" → ĐỪNG gợi ý thêm sản phẩm
- ĐỪNG gọi tool search_products
- CHỈ chào tạm biệt lịch sự và ngắn gọn

�📦 XỬ LÝ SẢN PHẨM:
- CHỈ đề cập sản phẩm khi có danh sách "Sản phẩm liên quan" được cung cấp
- **THÔNG TIN KHUYẾN MÃI**: Nếu sản phẩm có discount (Giảm X%), HÃY NHẮc khách hàng về ưu đãi này và giá sau giảm
- **THÔNG TIN TỒN KHO**: 
  * Nếu size "HẾT HÀNG" → Thông báo size đó tạm hết, gợi ý size khác còn hàng
  * Nếu size "sắp hết" (< 5 sản phẩm) → Khuyên khách đặt hàng sớm
  * CHỈ giới thiệu các size CÒN HÀNG
- **THÔNG TIN SIZE**: Nếu sản phẩm có field "Sizes: ..." hoặc "Tồn kho: ...", HÃY DÙNG thông tin này để trả lời về size. KHÔNG nói "không có thông tin size" nếu field đã có sẵn.
- **QUAN TRỌNG**: Kiểm tra kỹ tên sản phẩm có KHỚP với yêu cầu của khách không:
  * Nếu khách hỏi "giày" → CHỈ giới thiệu sản phẩm có từ "giày" trong tên
  * Nếu khách hỏi "áo" → CHỈ giới thiệu sản phẩm có từ "áo" trong tên
  * Nếu sản phẩm KHÔNG KHỚP loại → Trả lời "Xin lỗi, hiện tại cửa hàng không có [loại sản phẩm] phù hợp. Bạn có muốn xem [loại khác] không?"
- Nếu tìm thấy CHÍNH XÁC sản phẩm → CHỈ giới thiệu sản phẩm đó
- Nếu không tìm thấy chính xác → gợi ý các sản phẩm tương tự (CÙNG LOẠI)
- Dùng tool search_products khi cần tìm sản phẩm với điều kiện cụ thể

🖼️ HIỂN THỊ ẢNH:
- Ảnh sản phẩm TỰ ĐỘNG hiển thị, chỉ cần nói "Ảnh sản phẩm đã được hiển thị bên dưới"
- KHÔNG nói "tôi không thể hiển thị ảnh"

💬 PHONG CÁCH: Ngắn gọn, thân thiện, chuyên nghiệp, tập trung vào bán hàng`;

/**
 * Build context blocks for the AI based on available data
 */
export const buildContextBlocks = (longMem, relevantProducts) => {
  const contextBlocks = [];
  
  // Add long-term memory if available
  if (longMem?.length) {
    contextBlocks.push(`Bối cảnh:\n- ${longMem.join('\n- ')}`);
  }
  
  // Add product information if available
  if (relevantProducts?.length) {
    // Check if we have exact match
    const hasExactMatch = relevantProducts.some(p => p.matchType === 'exact');
    
    // Format product info with discount and stock
    const list = relevantProducts.map(p => {
      // Base info
      let info = `#${p.id}: ${p.name}`;
      
      // Price with discount
      if (p.discount_percent && p.discount_percent > 0) {
        const discountedPrice = Math.round(p.price * (100 - p.discount_percent) / 100);
        info += ` - Giá gốc: ${p.price}đ | Giảm ${p.discount_percent}% → Còn ${discountedPrice}đ`;
      } else {
        info += ` - ${p.price}đ`;
      }
      
      // Stock by size (format: "S:10, M:5, L:0")
      if (p.stock_by_size) {
        const stockInfo = p.stock_by_size.split(', ').map(pair => {
          const [size, stock] = pair.split(':');
          const stockNum = parseInt(stock) || 0;
          if (stockNum === 0) return `${size}: HẾT HÀNG`;
          if (stockNum < 5) return `${size}: CÒN ${stockNum} (sắp hết)`;
          return `${size}: ${stockNum}`;
        }).join(', ');
        info += ` | Tồn kho: ${stockInfo}`;
      } else if (p.sizes) {
        info += ` | Sizes: ${p.sizes}`;
      }
      
      // Short description
      if (p.description) {
        info += ' | ' + p.description.slice(0, 100);
      }
      
      return info;
    });
    
    if (hasExactMatch) {
      contextBlocks.push(
        `Sản phẩm TÌM THẤY CHÍNH XÁC (ảnh đã TỰ ĐỘNG hiển thị):\n${list.join('\n')}\n\nHÃY CHỈ giới thiệu sản phẩm này, KHÔNG đề cập sản phẩm khác. NHỚ thông báo về khuyến mãi (nếu có) và các size có sẵn.`
      );
    } else {
      contextBlocks.push(
        `Sản phẩm liên quan/gợi ý (ảnh đã TỰ ĐỘNG hiển thị):\n${list.join('\n')}\n\nKhông tìm thấy chính xác sản phẩm yêu cầu. Đây là các sản phẩm tương tự bạn có thể quan tâm. NHỚ thông báo về khuyến mãi (nếu có).`
      );
    }
  }
  
  return contextBlocks;
};

/**
 * Format conversation history for context
 */
export const formatConversationHistory = (recentHistory, fast = false) => {
  return recentHistory
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .slice(-(fast ? 3 : 4)) // Reduced from 6
    .map(m => `${m.role === 'assistant' ? 'AI' : 'U'}: ${(m.content || '').slice(0, 150)}`) // Shorter labels & truncate
    .join('\n');
};

/**
 * Product keywords for detection
 */
export const PRODUCT_KEYWORDS = {
  // Category keywords (Vietnamese with and without diacritics)
  categories: [
    'áo', 'ao',           // Shirts
    'quần', 'quan',       // Pants
    'giày', 'giay',       // Shoes
    'đồ', 'do',           // Clothes
    'găng', 'gang',       // Gloves
    'bóng', 'bong',       // Ball
  ],
  
  // Product-related keywords
  shopping: [
    'sản phẩm', 'san pham', // Products
    'mua', 'giá', 'gia',    // Buy, price
    'bao nhiêu', 'bao nhieu',
    'size', 'màu', 'mau',
    'tìm', 'tim', 'xem',    // Search, view
    'có', 'co', 'bán', 'ban',
    'shop', 'store',
  ],
  
  // Brand keywords
  brands: [
    'mu', 'barca', 'barcelona', 'real', 'madrid', 'arsenal', 
    'chelsea', 'liverpool', 'nike', 'adidas', 'puma'
  ]
};

/**
 * Off-topic keywords to filter out
 */
export const OFF_TOPIC_KEYWORDS = [
  'python', 'java', 'code', 'lap trinh', 'lập trình', 'programming',
  'thoi tiet', 'thời tiết', 'weather', 'troi mua', 'trời mưa',
  'nau an', 'nấu ăn', 'mon an', 'món ăn', 'recipe', 'banh mi', 'bánh mì',
  'dau dau', 'đau đầu', 'benh', 'bệnh', 'thuoc', 'thuốc', 'medicine', 'doctor',
  'chinh tri', 'chính trị', 'politics', 'tin tuc', 'tin tức', 'news',
  'du lich', 'du lịch', 'travel', 'phim', 'film', 'movie',
  'nhac', 'nhạc', 'music', 'hoc tap', 'học tập', 'study'
];

/**
 * Greeting keywords
 */
export const GREETING_KEYWORDS = [
  'xin chào', 'xin chao', 'chào', 'chao', 
  'hello', 'hi', 'hey', 'chào bạn', 'chao ban'
];

/**
 * Small talk keywords
 */
export const SMALL_TALK_KEYWORDS = [
  'cảm ơn', 'cam on', 'thank', 'ok', 
  'được', 'duoc', 'tốt', 'tot', 'bye', 
  'tạm biệt', 'tam biet'
];

/**
 * Intent Classification - Detect decline/goodbye/thanks
 */
const DECLINE_PATTERNS = [
  /\b(không mua|ko mua|k mua|khong mua|không lấy|ko lấy|k lấy)\b/i,
  /\b(thôi|thoi|khỏi|khoi|không cần|ko cần|k cần)\b/i,
];

const GOODBYE_PATTERNS = [
  /\b(bye|tạm biệt|tam biet|hẹn gặp|hen gap|chào tạm biệt|chao tam biet)\b/i,
];

const THANKS_PATTERNS = [
  /\b(cảm ơn|cam on|thank|thanks|tks|cám ơn|camon)\b/i,
];

/**
 * Check if message is a decline/goodbye/thanks intent
 * Returns true if user is ending conversation or declining to buy
 */
export function isDeclineOrGoodbyeMessage(message = '') {
  const msg = String(message || '').toLowerCase().trim();
  
  // Empty or too short
  if (msg.length < 2) return false;
  
  // Check all patterns
  const isDecline = DECLINE_PATTERNS.some(re => re.test(msg));
  const isGoodbye = GOODBYE_PATTERNS.some(re => re.test(msg));
  const isThanks = THANKS_PATTERNS.some(re => re.test(msg));
  
  return isDecline || isGoodbye || isThanks;
}

/**
 * Get polite goodbye response
 */
export function getGoodbyeResponse() {
  const responses = [
    'Cảm ơn bạn đã ghé thăm my_store! Hẹn gặp lại bạn lần sau. 😊',
    'Cảm ơn bạn! Nếu cần gì hãy quay lại my_store nhé. Chúc bạn một ngày tốt lành! 👋',
    'Rất vui được hỗ trợ bạn! Hẹn gặp lại. 😊',
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}
