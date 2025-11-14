# HƯỚNG DẪN SỬ DỤNG VNPAY TRONG HỆ THỐNG

## 📋 Tổng quan

Hệ thống đã được tích hợp VNPay Sandbox để test thanh toán trực tuyến. Tài liệu này hướng dẫn chi tiết cách sử dụng và test tính năng thanh toán VNPay.

## 🔧 Cấu hình hệ thống

### Backend Configuration
**File:** `Backend/my_store_backend/controllers/vnpayController.js`

```javascript
const vnpayConfig = {
    vnp_TmnCode: "AFHY5UKO",
    vnp_HashSecret: "A67W4EVFQOSKGMO5U38Y5HT20WFI0LE2",
    vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    vnp_Api: "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
    vnp_ReturnUrl: "http://localhost:3000/vnpay-return"
};
```

### Frontend Configuration
**File:** `frontend/src/api.js`

```javascript
const VNPAY_API_URL = "http://localhost:3006/vnpay";
```

## 🚀 Quy trình thanh toán VNPay

### 1. Người dùng chọn sản phẩm
- Thêm sản phẩm vào giỏ hàng
- Chọn size (nếu có)
- Điều chỉnh số lượng

### 2. Checkout
**Trang:** `/checkout`

Người dùng nhập thông tin:
- Họ tên
- Số điện thoại
- Địa chỉ (Tỉnh/Thành phố, Quận/Huyện, Phường/Xã, Địa chỉ cụ thể)
- **Phương thức thanh toán:** Chọn "Thanh toán qua VNPay"

### 3. Xác nhận đơn hàng
**Trang:** `/order-confirmation`

- Hệ thống hiển thị thông tin đơn hàng
- Người dùng xem lại và nhấn "Xác nhận đơn hàng"

### 4. Tạo đơn hàng và chuyển hướng VNPay

Khi người dùng xác nhận:

1. **Tạo đơn hàng trong database**
   - API: `POST /orders`
   - Trạng thái: `is_paid = false`, `status = 'pending'`

2. **Tạo URL thanh toán VNPay**
   - API: `POST /vnpay/create_payment_url`
   - Payload:
     ```json
     {
       "orderId": "123",
       "amount": 500000,
       "orderInfo": "Thanh toan don hang #123",
       "orderType": "billpayment",
       "language": "vn"
     }
     ```

3. **Chuyển hướng đến VNPay**
   - Lưu `pending_order_id` vào localStorage
   - Redirect: `window.location.href = vnpayResponse.data.paymentUrl`

### 5. Thanh toán trên VNPay

Người dùng thực hiện thanh toán trên cổng VNPay Sandbox.

**Thông tin test VNPay Sandbox:**

#### 🏦 Thẻ ATM nội địa
```
Ngân hàng: NCB
Số thẻ: 9704198526191432198
Tên chủ thẻ: NGUYEN VAN A
Ngày phát hành: 07/15
Mật khẩu OTP: 123456
```

#### 💳 Thẻ quốc tế
```
Số thẻ: 4111111111111111 (Visa)
Ngày hết hạn: 12/25
CVV: 123
Tên: TEST USER
```

### 6. VNPay callback - Return URL
**Trang:** `/vnpay-return`

Sau khi thanh toán (thành công hoặc thất bại), VNPay redirect về:
```
http://localhost:3000/vnpay-return?vnp_Amount=50000000&vnp_BankCode=NCB&vnp_ResponseCode=00&...
```

**Component:** `VNPayReturn.jsx`

Xử lý:
1. Nhận và parse query parameters
2. Kiểm tra `vnp_ResponseCode`:
   - `00`: Giao dịch thành công
   - Khác `00`: Giao dịch thất bại
3. Cập nhật trạng thái đơn hàng:
   - API: `POST /vnpay/update_payment_status`
   - Payload:
     ```json
     {
       "orderId": "123",
       "is_paid": true,
       "payment_info": "{\"transactionNo\":\"123456\",\"bankCode\":\"NCB\",...}"
     }
     ```
4. Hiển thị kết quả thanh toán
5. Xóa localStorage (cart, checkout_items, ...)

### 7. Hoàn thành
- **Thành công:** Hiển thị trang thành công, link đến "Đơn hàng của tôi"
- **Thất bại:** Hiển thị lỗi, cho phép thử lại

## 📊 Database Schema

### Bảng `orders`

```sql
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  account_id INT,
  total_amount DECIMAL(10,2),
  payment_method VARCHAR(50),  -- 'cod', 'vnpay', 'bank'
  is_paid TINYINT(1) DEFAULT 0,  -- 0: chưa thanh toán, 1: đã thanh toán
  payment_info TEXT,  -- JSON string chứa thông tin giao dịch VNPay
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'cancelled'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Ví dụ `payment_info` sau khi thanh toán VNPay:**
```json
{
  "transactionNo": "14342604",
  "bankCode": "NCB",
  "payDate": "20241114103045",
  "amount": 500000,
  "responseCode": "00"
}
```

## 🔄 API Endpoints

### 1. Tạo URL thanh toán VNPay
```
POST http://localhost:3006/vnpay/create_payment_url
Content-Type: application/json

{
  "orderId": "123",
  "amount": 500000,
  "orderInfo": "Thanh toan don hang #123",
  "orderType": "billpayment",
  "language": "vn",
  "bankCode": ""  // Optional, để trống để chọn trên VNPay
}

Response:
{
  "success": true,
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=...",
    "orderId": "123"
  }
}
```

### 2. Xác thực callback VNPay (Return URL)
```
GET http://localhost:3006/vnpay/vnpay_return?vnp_Amount=...&vnp_SecureHash=...

Response:
{
  "success": true,
  "code": "00",
  "message": "Giao dịch thành công",
  "data": {
    "orderId": "123",
    "amount": 500000,
    "orderInfo": "Thanh toan don hang #123",
    "responseCode": "00",
    "transactionNo": "14342604",
    "bankCode": "NCB",
    "payDate": "20241114103045"
  }
}
```

### 3. Cập nhật trạng thái thanh toán đơn hàng
```
POST http://localhost:3006/vnpay/update_payment_status
Content-Type: application/json

{
  "orderId": "123",
  "is_paid": true,
  "payment_info": "{\"transactionNo\":\"14342604\",...}"
}

Response:
{
  "success": true,
  "message": "Order payment status updated successfully"
}
```

### 4. IPN Callback (VNPay gọi về backend)
```
GET http://localhost:3006/vnpay/vnpay_ipn?vnp_Amount=...&vnp_SecureHash=...

Response:
{
  "RspCode": "00",
  "Message": "Success"
}
```

## 🧪 Hướng dẫn test

### Bước 1: Khởi động Backend
```powershell
cd Backend/my_store_backend
npm install
npm start
```
Backend chạy tại: `http://localhost:3006`

### Bước 2: Khởi động Frontend
```powershell
cd frontend
npm install
npm start
```
Frontend chạy tại: `http://localhost:3000`

### Bước 3: Test thanh toán

1. **Đăng nhập** vào hệ thống
2. **Thêm sản phẩm** vào giỏ hàng
3. **Checkout** và chọn "Thanh toán qua VNPay"
4. **Xác nhận đơn hàng**
5. Trên trang VNPay Sandbox:
   - Chọn "Thanh toán qua thẻ ATM nội địa/Tài khoản ngân hàng"
   - Chọn ngân hàng: **NCB**
   - Nhập số thẻ: **9704198526191432198**
   - Tên chủ thẻ: **NGUYEN VAN A**
   - Ngày phát hành: **07/15**
   - Nhấn "Tiếp tục"
   - Nhập mật khẩu OTP: **123456**
6. Kiểm tra kết quả trên trang `/vnpay-return`
7. Kiểm tra database xem đơn hàng đã được cập nhật `is_paid = 1` chưa

### Bước 4: Kiểm tra database

```sql
-- Xem đơn hàng vừa tạo
SELECT * FROM orders ORDER BY id DESC LIMIT 1;

-- Xem chi tiết thanh toán
SELECT id, total_amount, payment_method, is_paid, payment_info, status 
FROM orders 
WHERE id = 123;
```

## 🐛 Troubleshooting

### Lỗi thường gặp

#### 1. "Ngân hàng thanh toán không được hỗ trợ" (Error 76)
**Nguyên nhân:** Tài khoản sandbox chưa kích hoạt đầy đủ phương thức thanh toán

**Giải pháp:**
- Đăng nhập: https://sandbox.vnpayment.vn/merchantv2/
- Vào **Cấu hình** → **Phương thức thanh toán**
- Kích hoạt tất cả các phương thức
- Hoặc liên hệ VNPay support: support@vnpay.vn

#### 2. "Checksum không hợp lệ" (Error 97)
**Nguyên nhân:** `vnp_HashSecret` không chính xác hoặc cách tạo signature sai

**Giải pháp:**
- Kiểm tra lại `vnp_HashSecret` trong config
- Đảm bảo sort parameters theo alphabet trước khi hash

#### 3. "Không thể tạo link thanh toán VNPay"
**Nguyên nhân:** Backend API không chạy hoặc cấu hình sai

**Giải pháp:**
- Kiểm tra backend đã start chưa
- Kiểm tra VNPAY_API_URL trong frontend/src/api.js
- Xem log console backend

#### 4. Đơn hàng không được cập nhật sau thanh toán
**Nguyên nhân:** API update_payment_status bị lỗi

**Giải pháp:**
- Kiểm tra log trong VNPayReturn.jsx
- Kiểm tra orderId có chính xác không
- Kiểm tra route `/vnpay/update_payment_status` đã được register chưa

## 📝 Response Code VNPay

| Code | Ý nghĩa |
|------|---------|
| 00 | Giao dịch thành công |
| 07 | Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường) |
| 09 | Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking |
| 10 | Xác thực thông tin không đúng quá 3 lần |
| 11 | Đã hết hạn chờ thanh toán |
| 12 | Thẻ/Tài khoản bị khóa |
| 13 | Sai mật khẩu OTP |
| 24 | Khách hàng hủy giao dịch |
| 51 | Tài khoản không đủ số dư |
| 65 | Vượt quá hạn mức giao dịch trong ngày |
| 75 | Ngân hàng bảo trì |
| 79 | Nhập sai mật khẩu quá số lần quy định |
| 99 | Các lỗi khác |

## 🔐 Security Best Practices

1. **Không commit HashSecret vào Git**
   - Sử dụng environment variables
   - File: `.env`

2. **Kiểm tra signature mọi request**
   - Luôn verify `vnp_SecureHash` từ VNPay
   - Không tin tưởng client-side data

3. **Validate dữ liệu**
   - Kiểm tra orderId có tồn tại
   - Kiểm tra amount khớp với đơn hàng
   - Kiểm tra trạng thái đơn hàng trước khi cập nhật

4. **Logging**
   - Log tất cả giao dịch VNPay
   - Log lỗi để debug

## 📞 Liên hệ hỗ trợ

**VNPay Support:**
- Email: support@vnpay.vn
- Hotline: 1900 55 55 77
- Website: https://sandbox.vnpayment.vn/

**Documentation:**
- API Documentation: https://sandbox.vnpayment.vn/apis/
- Integration Guide: https://sandbox.vnpayment.vn/merchantv2/

## ✅ Checklist triển khai Production

- [ ] Đổi sang VNPay Production endpoint
- [ ] Cập nhật vnp_TmnCode và vnp_HashSecret từ Production
- [ ] Đổi Return URL và IPN URL sang domain thật
- [ ] Sử dụng HTTPS cho tất cả endpoints
- [ ] Lưu HashSecret vào environment variables
- [ ] Enable logging và monitoring
- [ ] Test với thẻ thật (số tiền nhỏ)
- [ ] Xử lý các edge cases và errors
- [ ] Backup database trước khi deploy

---

**Ngày cập nhật:** 14/11/2024  
**Phiên bản:** 1.0.0
