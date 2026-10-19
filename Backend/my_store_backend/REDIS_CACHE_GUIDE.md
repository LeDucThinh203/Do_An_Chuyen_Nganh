# Redis cache

Redis/Valkey là cache dùng chung tùy chọn; PostgreSQL vẫn là nguồn dữ liệu gốc. Nếu thiếu `REDIS_URL` hoặc Redis mất kết nối, API tự đọc PostgreSQL và tiếp tục phục vụ request.

## Cached reads

| Cache namespace | Data | TTL |
| --- | --- | ---: |
| `storefront` | Home/category product page | 20 seconds |
| `products` / `admin_products` | Product pages: public page / public full list / admin page / admin full list | 20 / 30 / 10 / 15 seconds |
| `product_details` | Product record and product detail with stock | 10 / 8 seconds |
| `categories` / `category_item` | Category list and individual category | 5 minutes |
| `sizes` / `size_item` | Size list and individual size | 5 minutes |
| `inventory` / `inventory_item` | Product size inventory and stock | 5 / 3 seconds |
| `product_ratings` | Product review page and its first-page summary | 30 seconds |

Ghi sản phẩm, danh mục, size, tồn kho hoặc đánh giá sẽ thay token version của namespace Redis. Cách này vô hiệu hóa cache trên mọi backend instance mà không phải quét key; token ngẫu nhiên cũng ngăn key cũ sống lại nếu Redis evict key version. Tạo đơn hàng cũng xóa hiệu lực cache liên quan đến tồn kho. TTL ngắn là lớp dự phòng khi dữ liệu bị đổi ngoài API.

Không cache địa chỉ, tài khoản, đơn hàng, thanh toán, chat hỗ trợ và lịch sử chat AI vì các dữ liệu đó gắn với người dùng, nhạy cảm hoặc cần trạng thái mới nhất.

## Local setup

Docker Compose ở thư mục gốc khởi chạy Redis và kết nối backend. Cổng Redis chỉ bind vào localhost để dùng khi phát triển; dữ liệu cache không được lưu bền.

```sh
docker compose up --build
```

Nếu chạy backend ngoài Compose, hãy khởi chạy Redis tương thích và đặt `REDIS_URL` (ví dụ `redis://localhost:6379`). `REDIS_KEY_PREFIX` dùng để tách key nếu nhiều ứng dụng chia sẻ một Redis instance.

## Render setup

Render Blueprint khai báo Key Value service riêng tư, gói free, tên `my-store-cache` tại Singapore và tự chuyển connection string nội bộ vào `REDIS_URL`. Gói free có bộ nhớ nhỏ và dữ liệu dễ mất/evict; điều này an toàn vì ứng dụng dựng lại cache từ PostgreSQL. Nếu workspace đã dùng suất Key Value free, hãy nối service Redis có sẵn bằng cách đặt `REDIS_URL` cho backend.

`GET /health` cho biết cache có được cấu hình và đang kết nối hay không. Redis mất kết nối không làm health check thất bại.
