# KIỂM TRA NHANH VNPAY INTEGRATION

## ✅ Checklist kiểm tra

### 1. Backend Files
- [x] `Backend/my_store_backend/controllers/vnpayController.js` - Đã thêm updateOrderPaymentStatus
- [x] `Backend/my_store_backend/routes/vnpay.js` - Đã thêm route update_payment_status
- [x] `Backend/my_store_backend/repositories/ordersRepository.js` - Đã có updateOrderStatus

### 2. Frontend Files
- [x] `frontend/src/api.js` - Đã thêm updateOrderPaymentStatus function
- [x] `frontend/src/view/Cart/VNPayReturn.jsx` - Đã update để gọi API mới
- [x] `frontend/src/view/Cart/Confirmation.jsx` - Đã có VNPay flow

### 3. Configuration
- [x] VNPay Config - Terminal ID: AFHY5UKO
- [x] Return URL - http://localhost:3000/vnpay-return
- [x] Backend Port - 3006
- [x] Frontend Port - 3000

## 🧪 Test Steps

### Test 1: Tạo Payment URL
```bash
# Test API tạo payment URL
curl -X POST http://localhost:3006/vnpay/create_payment_url \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST123",
    "amount": 100000,
    "orderInfo": "Test payment",
    "orderType": "billpayment",
    "language": "vn"
  }'
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
    "orderId": "TEST123"
  }
}
```

### Test 2: Update Payment Status
```bash
# Test API update payment status
curl -X POST http://localhost:3006/vnpay/update_payment_status \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "1",
    "is_paid": true,
    "payment_info": "{\"transactionNo\":\"123456\",\"bankCode\":\"NCB\"}"
  }'
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "message": "Order payment status updated successfully"
}
```

### Test 3: Full Flow (Manual)

1. **Khởi động servers**
   ```powershell
   # Terminal 1 - Backend
   cd Backend/my_store_backend
   npm start
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

2. **Truy cập:** http://localhost:3000

3. **Đăng nhập** (hoặc tạo tài khoản)

4. **Thêm sản phẩm vào giỏ**
   - Chọn sản phẩm có size
   - Thêm vào giỏ
   - Xem giỏ hàng

5. **Checkout**
   - Nhập thông tin giao hàng
   - Chọn "Thanh toán qua VNPay"
   - Nhấn "Xác nhận đơn hàng"

6. **Order Confirmation**
   - Kiểm tra thông tin
   - Nhấn "Xác nhận đơn hàng"
   - Hệ thống sẽ redirect đến VNPay

7. **Thanh toán VNPay Sandbox**
   - Chọn "Thanh toán qua thẻ ATM"
   - Chọn ngân hàng: **NCB**
   - Số thẻ: **9704198526191432198**
   - Tên: **NGUYEN VAN A**
   - Ngày phát hành: **07/15**
   - Nhấn "Tiếp tục"
   - Nhập OTP: **123456**
   - Nhấn "Xác nhận"

8. **Kiểm tra kết quả**
   - Redirect về `/vnpay-return`
   - Xem thông báo "Thanh toán thành công"
   - Check database

## 🔍 Debug Checklist

Nếu có lỗi, kiểm tra:

### Backend Console
```
Xem log khi gọi API:
- POST /vnpay/create_payment_url
- POST /vnpay/update_payment_status
```

### Frontend Console
```
Xem log trong VNPayReturn.jsx:
- 📥 VNPay Return Query Params
- Payment result
- ✅ Order payment status updated
```

### Database
```sql
-- Kiểm tra đơn hàng
SELECT id, name, total_amount, payment_method, is_paid, payment_info, status, created_at
FROM orders
ORDER BY id DESC
LIMIT 5;

-- Kiểm tra chi tiết đơn hàng
SELECT od.*, ps.stock, p.name
FROM order_details od
JOIN product_sizes ps ON od.product_sizes_id = ps.id
JOIN product p ON ps.product_id = p.id
WHERE od.order_id = YOUR_ORDER_ID;
```

### Network Tab (Browser DevTools)
```
Kiểm tra các request:
1. POST /vnpay/create_payment_url
2. Redirect to VNPay
3. GET /vnpay-return (with query params)
4. POST /vnpay/update_payment_status
```

## ⚠️ Common Issues

### Issue 1: "Cannot read property 'paymentUrl'"
**Cause:** Backend không trả về đúng format
**Fix:** Kiểm tra response từ `/vnpay/create_payment_url`

### Issue 2: Order không được update is_paid = 1
**Cause:** API update_payment_status bị lỗi
**Fix:** 
- Kiểm tra orderId có đúng không
- Kiểm tra route đã register chưa
- Xem backend console log

### Issue 3: VNPay trả về error 76
**Cause:** Sandbox account chưa kích hoạt phương thức thanh toán
**Fix:** Liên hệ VNPay support hoặc để bankCode = ""

### Issue 4: Checksum không hợp lệ (Error 97)
**Cause:** HashSecret sai hoặc signature generation sai
**Fix:** 
- Kiểm tra vnp_HashSecret = "A67W4EVFQOSKGMO5U38Y5HT20WFI0LE2"
- Kiểm tra sortObject function

## 📊 Success Metrics

Sau khi test thành công, bạn nên thấy:

✅ **Database:**
- Order mới với `is_paid = 1`
- `payment_method = 'vnpay'`
- `payment_info` chứa JSON hợp lệ

✅ **Frontend:**
- Trang success hiển thị đúng
- Cart được xóa
- Có thể xem đơn hàng trong "Tài khoản"

✅ **Console:**
- Không có error
- Có log "Order payment status updated successfully"

## 🎯 Next Steps

Sau khi test thành công:

1. Test với nhiều scenarios:
   - [ ] Thanh toán thành công
   - [ ] Thanh toán thất bại (cancel)
   - [ ] Đơn hàng nhiều sản phẩm
   - [ ] Đơn hàng với nhiều size khác nhau

2. Test edge cases:
   - [ ] Không đủ stock
   - [ ] Network error
   - [ ] User đóng tab giữa chừng

3. Production ready:
   - [ ] Environment variables
   - [ ] HTTPS
   - [ ] Production VNPay credentials
   - [ ] Error monitoring
   - [ ] Transaction logging

---

**Ghi chú:** Đây là bản test cho Sandbox. Production cần thêm security measures.
