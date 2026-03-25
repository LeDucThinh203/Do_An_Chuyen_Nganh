# Deploy Full Lên Netlify (Frontend) + Backend API

Tài liệu này giúp bạn deploy web React lên Netlify theo cách ổn định cho dự án hiện tại.

## 1) Thực tế quan trọng

Netlify phù hợp nhất cho frontend tĩnh (React build). Backend Express + MySQL của dự án nên chạy trên một host backend riêng (Render, Railway, VPS, v.v.).

Mô hình khuyến nghị:
- Frontend: Netlify
- Backend API: Render (hoặc nền tảng Node.js khác)
- Database MySQL: dịch vụ MySQL online

## 2) Chuẩn bị backend trước

1. Deploy backend tại thư mục `Backend/my_store_backend` lên Render.
2. Kiểm tra API hoạt động bằng endpoint:
   - `https://your-backend-domain/health`
3. Bật CORS cho frontend domain Netlify (nếu cần giới hạn domain).

## 3) Cấu hình frontend cho production

Trong Netlify, bạn sẽ set biến môi trường:
- Key: `REACT_APP_API_URL`
- Value: `https://your-backend-domain`

Lưu ý:
- Không thêm dấu `/` cuối URL (ví dụ đúng: `https://abc.onrender.com`)
- Frontend sẽ gọi API kiểu: `https://abc.onrender.com/product`, `.../account/login`, v.v.

## 4) File cấu hình đã có sẵn

Dự án đã có file `netlify.toml` ở root để Netlify build đúng thư mục `frontend`:
- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `build`
- SPA redirect: `/* -> /index.html`

## 5) Deploy trên Netlify Dashboard

1. Push code mới nhất lên GitHub.
2. Vào Netlify -> Add new site -> Import an existing project.
3. Chọn repo của bạn.
4. Build settings (nếu Netlify không tự đọc `netlify.toml`):
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/build`
5. Mở phần Environment variables, thêm:
   - `REACT_APP_API_URL=https://your-backend-domain`
6. Bấm Deploy site.

## 6) Gắn domain và HTTPS

1. Site settings -> Domain management.
2. Add custom domain nếu bạn có domain riêng.
3. Netlify tự cấp SSL (HTTPS) sau khi DNS trỏ đúng.

## 7) Kiểm tra sau deploy

1. Mở website Netlify.
2. Kiểm tra các chức năng gọi API:
   - Danh sách sản phẩm
   - Đăng nhập
   - Tạo đơn hàng
3. Nếu thấy lỗi CORS hoặc Network Error:
   - Kiểm tra `REACT_APP_API_URL`
   - Kiểm tra backend còn hoạt động
   - Kiểm tra cấu hình CORS backend

## 8) Lỗi thường gặp

1. Trang trắng sau F5 ở route con
- Nguyên nhân: thiếu SPA redirect.
- Cách xử lý: đảm bảo `netlify.toml` có redirect `/* -> /index.html`.

2. API gọi về domain Netlify thay vì backend
- Nguyên nhân: thiếu `REACT_APP_API_URL` trên Netlify.
- Cách xử lý: thêm biến môi trường rồi Redeploy.

3. Build fail do sai thư mục
- Nguyên nhân: Netlify build ở root thay vì `frontend`.
- Cách xử lý: kiểm tra base directory = `frontend`.

## 9) Redeploy nhanh sau khi sửa env

Trong Netlify:
- Deploys -> Trigger deploy -> Deploy site

Hoặc push commit mới lên nhánh đang connected để auto deploy.

## 10) Kết luận

Với dự án hiện tại, cách "full" ổn định nhất là:
- Frontend React chạy trên Netlify
- Backend Express + MySQL chạy trên Render (hoặc host Node tương đương)

Nếu bạn muốn, có thể chuyển backend sang Netlify Functions, nhưng sẽ phải refactor lớn (serverless, cold start, kết nối DB, routing lại toàn bộ API).
