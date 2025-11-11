# Chat Widget AI - Hướng Dẫn Sử Dụng

## Tổng Quan
Chat Widget AI là một widget chat thông minh được tích hợp vào góc phải dưới của trang web, cho phép người dùng tương tác với trợ lý AI.

## Tính Năng

### 1. **Nút Chat Nổi**
- Vị trí: Góc phải dưới màn hình
- Hiệu ứng: Animation pulse để thu hút sự chú ý
- Badge "AI" để người dùng biết đây là chat bot AI

### 2. **Khung Chat**
- **Mở/Đóng**: Click vào nút chat để mở hoặc đóng khung chat
- **Thu nhỏ/Phóng to**: 
  - Click nút "-" để thu nhỏ khung chat (chỉ hiện header)
  - Click nút "+" để phóng to khung chat trở lại
- **Đóng hoàn toàn**: Click nút "X" để đóng khung chat

### 3. **Giao Diện Chat**
- **Header**: Hiển thị avatar AI, tên "AI Trợ Lý" và trạng thái online
- **Khu vực tin nhắn**: 
  - Tin nhắn của người dùng hiển thị bên phải (màu tím)
  - Tin nhắn của AI hiển thị bên trái (màu trắng)
  - Tự động cuộn xuống tin nhắn mới nhất
  - Hiển thị thời gian cho mỗi tin nhắn
- **Typing indicator**: Hiển thị animation "đang gõ..." khi AI đang xử lý

### 4. **Gửi Tin Nhắn**
- Nhập tin nhắn vào ô input
- Ấn Enter hoặc click nút gửi để gửi tin nhắn
- Không thể gửi tin nhắn rỗng hoặc khi AI đang xử lý

## Cấu Hình API

Widget này kết nối với API AI tại:
```
http://localhost:3006/ai/chat
```

### Request Format:
```json
{
  "message": "Tin nhắn của người dùng",
  "userId": 123,
  "sessionId": "unique-session-id",
  "fast": true
}
```

### Response Format:
```json
{
  "sessionId": "unique-session-id",
  "text": "Phản hồi của AI",
  "tools": [],
  "context": {
    "products": []
  }
}
```

## Cài Đặt

### 1. Files Đã Tạo:
- `frontend/src/view/Chat/ChatWidget.jsx` - Component React
- `frontend/src/view/Chat/ChatWidget.css` - Styling

### 2. Đã Tích Hợp Vào:
- `frontend/src/App.js` - ChatWidget được thêm vào layout chính

### 3. Không Cần Cài Đặt Thêm:
- Không cần cài thêm package
- Sử dụng React hooks có sẵn (useState, useRef, useEffect)
- Sử dụng fetch API có sẵn của browser

## Responsive Design

Widget tự động điều chỉnh kích thước trên các thiết bị:
- **Desktop**: 380px x 600px
- **Mobile**: Toàn màn hình (trừ margin 20px)

## Tùy Chỉnh

### Thay Đổi Màu Sắc:
Trong file `ChatWidget.css`, tìm và thay đổi:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Thay Đổi Kích Thước:
Trong file `ChatWidget.css`, class `.chat-window`:
```css
width: 380px;    /* Chiều rộng */
height: 600px;   /* Chiều cao */
```

### Thay Đổi Vị Trí:
Trong file `ChatWidget.css`, class `.chat-widget-container`:
```css
bottom: 20px;    /* Khoảng cách từ đáy */
right: 20px;     /* Khoảng cách từ phải */
```

## Xử Lý Lỗi

Widget có xử lý lỗi tự động:
- Nếu API không phản hồi, hiển thị thông báo lỗi
- Nếu mạng bị gián đoạn, thông báo cho người dùng
- Tin nhắn lỗi được hiển thị dưới dạng tin nhắn của bot

## Animation & Hiệu Ứng

1. **Pulse Animation**: Nút chat nhấp nháy nhẹ
2. **Slide Up**: Khung chat xuất hiện mượt mà từ dưới lên
3. **Fade In**: Tin nhắn mới xuất hiện với hiệu ứng fade
4. **Typing Indicator**: Animation 3 chấm nhảy
5. **Hover Effects**: Các nút có hiệu ứng khi di chuột qua

## Trải Nghiệm Người Dùng

- **Auto-scroll**: Tự động cuộn đến tin nhắn mới nhất
- **Timestamp**: Mỗi tin nhắn có thời gian gửi
- **Conversation History**: Lưu lịch sử hội thoại để AI có ngữ cảnh
- **Loading State**: Hiển thị trạng thái đang xử lý
- **Disabled State**: Vô hiệu hóa input khi đang xử lý

## Lưu Ý

1. Cần đảm bảo API AI đang chạy tại `http://localhost:3006`
2. Widget hiển thị cho tất cả người dùng (đã đăng nhập hoặc chưa)
3. Lịch sử chat được lưu trên backend theo sessionId
4. Nếu đã đăng nhập, AI sẽ có thêm context về user để cá nhân hóa

## Tương Lai

Có thể mở rộng thêm:
- Lưu lịch sử chat vào localStorage
- Gửi file/hình ảnh
- Voice chat
- Multiple chat sessions
- Emoji picker
- Rich text formatting
