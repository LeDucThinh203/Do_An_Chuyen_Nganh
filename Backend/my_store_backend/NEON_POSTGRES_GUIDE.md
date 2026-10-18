# Neon PostgreSQL và connection pool

Backend dùng PostgreSQL qua `pg` (node-postgres). Module `db.js` tạo một `pg.Pool` duy nhất cho tiến trình Node.js; các repository và dịch vụ dùng chung pool này. Khi `DATABASE_URL` là URL pooled của Neon, kết nối đi qua pool ứng dụng rồi tới PgBouncer của Neon.

## 1. Lấy URL pooled từ Neon

1. Tạo hoặc mở project PostgreSQL trong Neon Console.
2. Mở **Connect**, chọn branch, database và role cần dùng.
3. Chọn **Pooled connection** rồi sao chép URL. Hostname cần có hậu tố `-pooler`; giữ nguyên tham số TLS do Neon cung cấp, thường có `sslmode=require`.
4. Đặt URL vào biến môi trường `DATABASE_URL`. Không lưu mật khẩu vào Git.

```env
DATABASE_URL=postgresql://USER:PASSWORD@ep-example-pooler.REGION.aws.neon.tech/DB?sslmode=require
DB_POOL_MAX=10
DB_IDLE_TIMEOUT_MS=30000
DB_CONN_TIMEOUT_MS=15000
```

Dùng URL trực tiếp (không có `-pooler`) cho công cụ quản trị hoặc migration cần kết nối session lâu dài; `pg_dump`/`pg_restore` cũng cần URL trực tiếp. Với ứng dụng web này, URL pooled là lựa chọn mặc định.

## 2. Khởi tạo schema và chạy backend

Chạy `Database/POSTGRES_RENDER_INIT.sql` một lần trong Neon SQL Editor để tạo các bảng nghiệp vụ. Backend tự tạo các bảng AI và support chat khi khởi động. Nếu cần nhập dữ liệu từ dump MySQL cũ, cấu hình `DATABASE_URL` rồi chạy từ thư mục backend:

```powershell
npm run db:import:mysql
```

Kiểm tra kết nối và khởi động:

```powershell
npm run db:check
npm start
```

`db:check` chạy truy vấn qua chính pool mà backend sử dụng.

## 3. Cấu hình pool

| Biến | Mặc định | Ý nghĩa |
| --- | ---: | --- |
| `DB_POOL_MAX` | `10` | Số kết nối tối đa của pool trong mỗi tiến trình Node.js |
| `DB_IDLE_TIMEOUT_MS` | `30000` | Đóng kết nối ứng dụng đã idle quá thời gian này |
| `DB_CONN_TIMEOUT_MS` | `15000` | Thời gian tối đa chờ mở kết nối |

Giới hạn tổng kết nối ứng dụng xấp xỉ `số backend instances × DB_POOL_MAX`. Chỉnh `DB_POOL_MAX` theo số instance và giới hạn compute; pool của ứng dụng giữ kết nối có thể tái sử dụng, còn Neon PgBouncer ghép nhiều client vào ít kết nối PostgreSQL hơn.

Neon chạy pooler ở transaction mode; tránh dựa vào trạng thái session như `SET`, temporary table giữ qua transaction, hoặc session-level advisory lock. Các transaction hiện tại giữ một client từ `BEGIN` tới `COMMIT`/`ROLLBACK`, sau đó gọi `release()`. Backend đóng pool khi nhận `SIGTERM` hoặc `SIGINT`.

## 4. Render và Docker Compose

- Trên Render, đặt `DATABASE_URL` thành URL pooled lấy từ Neon. Blueprint đã khai báo biến này cùng các tham số pool.
- Docker Compose mặc định chạy PostgreSQL cục bộ và nạp schema ban đầu. Muốn kết nối Compose tới Neon, khai báo URL pooled trong file `.env` ở thư mục gốc trước khi chạy `docker compose up`.
- Khi chạy backend trực tiếp trên máy, đặt `DATABASE_URL` trong `Backend/my_store_backend/.env`.

## Tài liệu tham khảo

- [Neon: Connection pooling](https://neon.com/docs/connect/connection-pooling)
- [Neon: Kết nối Node.js và PostgreSQL](https://neon.com/docs/guides/node)
- [Neon: Tối ưu latency bằng cách tái sử dụng kết nối](https://neon.com/blog/how-to-minimise-the-impact-of-database-latency)
