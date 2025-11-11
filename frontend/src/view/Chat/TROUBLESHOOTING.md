# Hướng Dẫn Khắc Phục Sự Cố Chat Widget

## ✅ Đã Sửa Các Lỗi

### 1. **Lỗi API Response Format**
- **Vấn đề**: Frontend mong đợi `data.response` nhưng API trả về `data.text`
- **Giải pháp**: Đã sửa để xử lý cả hai format: `data.text || data.response`

### 2. **Lỗi Request Body**
- **Vấn đề**: Frontend gửi `conversationHistory` mà backend không xử lý
- **Giải pháp**: Đã loại bỏ và thay thế bằng `sessionId` - backend tự quản lý lịch sử

### 3. **Thiếu Session Management**
- **Vấn đề**: Không có sessionId để backend lưu lịch sử chat
- **Giải pháp**: Đã thêm sessionId tự động tạo cho mỗi phiên chat

### 4. **Thiếu User Context**
- **Vấn đề**: Backend cần userId để cá nhân hóa trải nghiệm
- **Giải pháp**: Đã tích hợp Session để lấy userId nếu user đã đăng nhập

## 🔧 Checklist Để Chat Hoạt Động

### 1. Backend Phải Đang Chạy
```bash
# Kiểm tra backend
cd Backend/my_store_backend
npm start
```
Backend phải chạy ở: `http://localhost:3006` (không phải 3000!)

### 2. Database Phải Được Setup
- Bảng `chat_messages` phải tồn tại
- Bảng `product_embeddings` phải tồn tại
- Kiểm tra file `Database/AI_Schema.sql`

### 3. Gemini API Key Phải Được Cấu Hình
```bash
# File .env trong Backend/my_store_backend
GEMINI_API_KEY=your_api_key_here
```

### 4. Frontend Phải Được Build Lại
```bash
cd frontend
npm start
```

## 🧪 Cách Test Chat Widget

### Test 1: Kiểm tra Backend API trực tiếp
```powershell
# PowerShell
$body = @{
    message = "Xin chào"
    fast = $true
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3006/ai/chat" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

Hoặc dùng curl:
```bash
curl -X POST http://localhost:3006/ai/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Xin chào\",\"fast\":true}"
```

**Kết quả mong đợi**:
```json
{
  "sessionId": "anon-xxxxx",
  "text": "Xin chào! Tôi có thể giúp gì cho bạn?",
  "tools": [],
  "context": {
    "products": []
  }
}
```

### Test 2: Kiểm tra Console Log
1. Mở DevTools (F12) trong browser
2. Chuyển sang tab Console
3. Gửi tin nhắn trong chat
4. Xem log "API Response:" để kiểm tra phản hồi

### Test 3: Kiểm tra Network Tab
1. Mở DevTools (F12)
2. Chuyển sang tab Network
3. Gửi tin nhắn
4. Tìm request đến `/ai/chat`
5. Kiểm tra:
   - Status code (phải là 200)
   - Request payload
   - Response data

## ❌ Các Lỗi Thường Gặp

### Lỗi 1: "Failed to fetch" hoặc Network Error
**Nguyên nhân**: Backend không chạy hoặc CORS issue

**Giải pháp**:
1. Kiểm tra backend đang chạy: `http://localhost:3006`
2. Kiểm tra CORS trong `server.js`:
```javascript
app.use(cors());
```

### Lỗi 2: "404 Not Found"
**Nguyên nhân**: Route `/ai/chat` không tồn tại

**Giải pháp**:
1. Kiểm tra file `Backend/my_store_backend/routes/ui.js`:
```javascript
import aiRoutes from './ai.js';
router.use('/ai', aiRoutes);
```
2. Route đúng là `/ai/chat` không phải `/api/ai/chat`

### Lỗi 3: "500 Internal Server Error"
**Nguyên nhân**: Backend gặp lỗi (thường là Gemini API)

**Giải pháp**:
1. Kiểm tra log backend trong terminal
2. Kiểm tra GEMINI_API_KEY trong .env
3. Kiểm tra connection database

### Lỗi 4: Chat hiển thị "Xin lỗi, tôi không thể trả lời"
**Nguyên nhân**: Response từ API không có trường `text`

**Giải pháp**:
1. Kiểm tra Console log để xem response thực tế
2. Backend có thể đang trả lỗi degraded-response

### Lỗi 5: Tin nhắn không gửi được
**Nguyên nhân**: Input rỗng hoặc đang loading

**Giải pháp**:
- Đảm bảo nhập text trước khi gửi
- Chờ AI trả lời xong mới gửi tin mới

## 🔍 Debug Tips

### 1. Xem Request/Response
Thêm log trong ChatWidget.jsx:
```javascript
console.log('Sending:', { message: inputMessage, userId, sessionId });
console.log('Response:', data);
```

### 2. Xem Backend Logs
Backend sẽ log:
- `[AI chat] error` nếu có lỗi
- Các warning về embedding, memory

### 3. Kiểm tra State
Thêm log để xem state:
```javascript
console.log('Messages:', messages);
console.log('IsLoading:', isLoading);
```

## 📝 API Documentation

### POST /ai/chat

**URL**: `http://localhost:3006/ai/chat`

**Request Body**:
```json
{
  "message": "string (required)",
  "userId": "number (optional)",
  "sessionId": "string (optional)",
  "fast": "boolean (optional, default: false)",
  "topK": "number (optional, default: 5)"
}
```

**Response**:
```json
{
  "sessionId": "string",
  "text": "string",
  "tools": [],
  "context": {
    "products": []
  }
}
```

## 🚀 Performance Tips

1. **Fast Mode**: Đã enable mặc định (`fast: true`) để phản hồi nhanh hơn
2. **Session Management**: Backend tự lưu và quản lý lịch sử chat
3. **User Context**: Tự động lấy userId nếu đã đăng nhập

## 📞 Support

Nếu vẫn gặp lỗi:
1. Kiểm tra tất cả checklist trên
2. Xem log trong Console và Network tab
3. Kiểm tra backend logs
4. Đảm bảo database đã được setup đúng
