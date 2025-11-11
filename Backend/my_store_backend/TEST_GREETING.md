# Test Case: Greeting Detection

## ✅ Fixed Issue
**Vấn đề**: Khi người dùng chỉ chào hỏi (vd: "hello ban", "xin chào"), hệ thống vẫn trả về danh sách sản phẩm không liên quan.

**Nguyên nhân**: Hệ thống luôn chạy `semanticSearchProducts()` cho MỌI tin nhắn.

**Giải pháp**: Thêm logic phát hiện greeting/small talk để SKIP product search.

---

## 🧪 Test Cases

### ❌ KHÔNG nên hiển thị sản phẩm:
```
✓ "hello"
✓ "hi"
✓ "xin chào"
✓ "chào bạn"
✓ "chào ban"
✓ "hello ban"
✓ "cảm ơn"
✓ "thank you"
✓ "ok"
✓ "được"
✓ "bye"
✓ "tạm biệt"
```

### ✅ NÊN hiển thị sản phẩm:
```
✓ "áo đấu MU"
✓ "tôi muốn mua giày"
✓ "có áo nào đẹp không"
✓ "sản phẩm giá rẻ"
✓ "xem quần đá bóng"
✓ "tìm đồ size M"
```

---

## 📝 Code Changes

### File: `controllers/aiController.js`

```javascript
// New function to detect product-related queries
const isProductQuery = (msg) => {
  const lower = msg.toLowerCase();
  
  // Greetings and small talk - NO product search
  const greetings = ['xin chào', 'chào', 'hello', 'hi', 'hey', 'chào bạn', 'chào ban'];
  const smallTalk = ['cảm ơn', 'thank', 'ok', 'được', 'tốt', 'bye', 'tạm biệt'];
  
  if (greetings.some(g => lower.includes(g)) && msg.length < 20) return false;
  if (smallTalk.some(s => lower.includes(s)) && msg.length < 15) return false;
  
  // Product-related keywords
  const productKeywords = ['áo', 'quần', 'giày', 'đồ', 'sản phẩm', 'mua', 'giá', 'bao nhiêu', 
                          'size', 'màu', 'tìm', 'xem', 'có', 'bán', 'shop', 'store'];
  return productKeywords.some(k => lower.includes(k)) || msg.length > 30;
};

const shouldSearchProducts = isProductQuery(message);

// Only search products if needed
shouldSearchProducts ? semanticSearchProducts(message, topK) : Promise.resolve([])
```

---

## 🎯 Expected Behavior

### Test: "hello ban"
**Before Fix:**
```json
{
  "text": "Chào bạn! Bạn cần mình hỗ trợ gì không? 😊",
  "context": {
    "products": [
      { "id": 62, "name": "Quả bóng đá cơ đỏ sao vàng", "price": 160000 },
      { "id": 61, "name": "Đồ Đá Banh CLB Miami Màu Hồng 2023", "price": 169000 },
      { "id": 66, "name": "Áo đội tuyển Tây Ban Nha...", "price": 189000 }
    ]
  }
}
```

**After Fix:**
```json
{
  "text": "Chào bạn! Bạn cần mình hỗ trợ gì không? 😊",
  "context": {
    "products": []  // ✅ EMPTY - No products!
  }
}
```

---

## ✨ Benefits

1. **Better UX**: Không hiển thị sản phẩm ngẫu nhiên khi chỉ chào hỏi
2. **Faster Response**: Skip semantic search khi không cần thiết
3. **Reduced API Calls**: Tiết kiệm Gemini API embedding calls
4. **Cleaner UI**: Chat widget không bị "spam" sản phẩm

---

## 🔍 How to Test

1. Mở chat widget: http://localhost:3000
2. Gửi: "hello ban" → Không có sản phẩm
3. Gửi: "áo đấu MU" → Có sản phẩm liên quan
4. Gửi: "cảm ơn" → Không có sản phẩm
5. Gửi: "tìm giày" → Có sản phẩm giày
