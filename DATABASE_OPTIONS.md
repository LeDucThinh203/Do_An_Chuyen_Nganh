# 🗄️ Database Options

> Backend hiện chạy PostgreSQL qua `pg.Pool`. Neon PostgreSQL là cấu hình được hỗ trợ; các lựa chọn MySQL bên dưới là tài liệu cũ và không tương thích trực tiếp với backend hiện tại. Xem [hướng dẫn Neon và connection pool](./Backend/my_store_backend/NEON_POSTGRES_GUIDE.md).

## Tổng Quan

Render.com không có MySQL free tier, nhưng có nhiều dịch vụ MySQL miễn phí khác:

---

## 🌟 Option 1: FreeSQLDatabase.com (KHUYẾN NGHỊ)

### ✅ Ưu Điểm
- Hoàn toàn miễn phí
- Không cần thẻ tín dụng
- Setup nhanh (2 phút)
- Hỗ trợ phpMyAdmin
- Uptime tốt

### ❌ Giới Hạn
- 5MB storage
- Shared hosting (performance trung bình)

### 📝 Cách Đăng Ký

1. **Truy cập:** https://www.freesqldatabase.com/
2. **Click:** "Create Free MySQL Database"
3. **Điền form:**
   - Database Name: `my_store_db` (hoặc tên bạn muốn)
   - Username: Tự động generate
   - Password: Tự động generate
4. **Submit** → Nhận email confirmation
5. **Lưu thông tin:**
   ```
   Server: sql12.freesqldatabase.com
   Database Name: sql12xxxxx_mystore
   Username: sql12xxxxx
   Password: xxxxxxxxx
   Port: 3306
   phpMyAdmin: http://www.phpmyadmin.co
   ```

### 🔧 Import Database

**Qua phpMyAdmin:**
1. Truy cập: http://www.phpmyadmin.co
2. Login với credentials trên
3. Import → Choose file: `Database/DBWebBanDoBongDa.sql`
4. Click **Go**

**Qua Command Line:**
```bash
mysql -h sql12.freesqldatabase.com -u sql12xxxxx -p sql12xxxxx < Database/DBWebBanDoBongDa.sql
```

---

## 🌟 Option 2: db4free.net

### ✅ Ưu Điểm
- Miễn phí vĩnh viễn
- 200MB storage (đủ cho development)
- MySQL 8.0
- Không cần thẻ tín dụng

### ❌ Giới Hạn
- Không dùng cho production
- Performance không đảm bảo
- Có thể bị delete nếu inactive lâu

### 📝 Cách Đăng Ký

1. **Truy cập:** https://www.db4free.net
2. **Click:** "Sign Up"
3. **Điền form:**
   - Database Name: `mystoredb` (3-16 chars, lowercase)
   - Username: `mystoreuser`
   - Password: `YourStrongPassword123`
   - Email: your-email@example.com
4. **Confirm email**
5. **Lưu thông tin:**
   ```
   Server: db4free.net
   Database: mystoredb
   Username: mystoreuser
   Password: YourStrongPassword123
   Port: 3306
   ```

### 🔧 Import Database

```bash
mysql -h db4free.net -u mystoreuser -p mystoredb < Database/DBWebBanDoBongDa.sql
```

---

## 🌟 Option 3: Aiven MySQL

### ✅ Ưu Điểm
- $300 credit khi đăng ký
- MySQL chính thống
- Performance tốt
- SSL/TLS support
- Monitoring tools

### ❌ Giới Hạn
- Cần thẻ tín dụng (không charge nếu dùng credit)
- Sau khi hết credit: $10-20/tháng
- Credit hết hạn sau 30-90 ngày

### 📝 Cách Đăng Ký

1. **Truy cập:** https://aiven.io
2. **Sign Up** → Nhận $300 credit
3. **Create Service:**
   - Service: MySQL
   - Cloud: AWS/Google/Azure
   - Region: Singapore (gần VN nhất)
   - Plan: Startup-4 (smallest)
4. **Wait 2-3 minutes** for service to start
5. **Copy credentials:**
   ```
   Host: mysql-xxxxx.aivencloud.com
   Port: 12345
   User: avnadmin
   Password: xxxxxxxxx
   Database: defaultdb
   ```

### 🔧 Import Database

```bash
mysql -h mysql-xxxxx.aivencloud.com -P 12345 -u avnadmin -p defaultdb < Database/DBWebBanDoBongDa.sql
```

---

## 🌟 Option 4: PlanetScale (Serverless MySQL)

### ✅ Ưu Điểm
- Serverless, auto-scaling
- 5GB storage free
- 1 billion row reads/month
- Branching (như Git)
- Modern dashboard

### ❌ Giới Hạn
- Không hỗ trợ Foreign Keys (!)
- Cần modify schema
- Khu vực Asia chỉ có paid plan

### 📝 Cách Đăng Ký

1. **Truy cập:** https://planetscale.com
2. **Sign up with GitHub**
3. **Create database:**
   - Name: `my-store`
   - Region: AWS us-east (free tier)
4. **Get connection string:**
   ```
   mysql://user:pass@host/database?sslaccept=strict
   ```

⚠️ **Lưu ý:** Cần bỏ Foreign Keys trong SQL schema!

---

## 🌟 Option 5: Railway MySQL

### ✅ Ưu Điểm
- $5 credit free mỗi tháng
- MySQL + PostgreSQL
- Auto deploy from GitHub
- Modern UI

### ❌ Giới Hạn
- Cần thẻ tín dụng
- $5/tháng sau khi hết credit
- Credit reset hàng tháng

### 📝 Cách Đăng Ký

1. **Truy cập:** https://railway.app
2. **Sign up with GitHub**
3. **New Project** → **MySQL**
4. **Copy credentials** từ Variables tab

---

## 🌟 Neon PostgreSQL (Backend hiện tại)

### ✅ Ưu Điểm
- Hoàn toàn miễn phí
- 512MB storage
- Serverless
- Auto-suspend khi không dùng

### 📝 Chuyển Đổi

Backend đã dùng `pg.Pool` và hỗ trợ URL Neon trong `DATABASE_URL`. Chọn **Pooled connection** trong Neon Console để lấy URL có hostname `-pooler`, sau đó cấu hình URL đó trong môi trường backend.

---

## 📊 So Sánh

| Service | Free Tier | Storage | Speed | Uptime | Best For |
|---------|-----------|---------|-------|--------|----------|
| **FreeSQLDatabase** | ✅ Forever | 5MB | ⭐⭐ | ⭐⭐⭐ | **Testing** |
| **db4free.net** | ✅ Forever | 200MB | ⭐⭐ | ⭐⭐ | Development |
| **Aiven** | 💳 $300 credit | 10GB+ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Production |
| **PlanetScale** | ✅ Forever | 5GB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Modern Apps |
| **Railway** | 💳 $5/mo | Unlimited | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Side Projects |

---

## 🎯 Khuyến Nghị

### 🧪 Cho Testing/Demo:
→ **Neon PostgreSQL** (được hỗ trợ bởi backend hiện tại)

### 💻 Cho Development:
→ **Neon PostgreSQL** (dùng pooled URL cho ứng dụng)

### 🚀 Cho Production:
→ **Neon PostgreSQL pooled endpoint** (`-pooler`)

### 💰 Budget Limited:
→ **Neon PostgreSQL** + điều chỉnh DB_POOL_MAX theo số backend instance

---

## 🔧 Setup Cho Render

Sau khi có database, thêm vào Render Environment Variables:

```env
DATABASE_URL=postgresql://USER:PASSWORD@ep-example-pooler.REGION.aws.neon.tech/DB?sslmode=require
DB_POOL_MAX=10
DB_IDLE_TIMEOUT_MS=30000
DB_CONN_TIMEOUT_MS=15000
```

---

## 🐛 Troubleshooting

### Connection timeout
- Check firewall
- Verify host/port
- Test từ local trước

### Access denied
- Verify username/password
- Check user permissions
- Recreate user nếu cần

### Database not found
- Verify database name
- Create database nếu chưa có

### Import failed
- Check file size limit
- Split large SQL files
- Use command line thay vì phpMyAdmin

---

## 💡 Tips

1. **Always backup:** Export database trước khi modify
2. **Test local:** Dùng `test_db_connection.js` script
3. **Monitor usage:** Check storage/connection limits
4. **Optimize queries:** Index các columns hay query
5. **Connection pooling:** Dùng `pg.Pool` dùng chung trong backend và pooled endpoint của Neon (`-pooler`).

---

## 🆘 Support

### FreeSQLDatabase
- Forum: https://www.freesqldatabase.com/forum/
- Email: support@freesqldatabase.com

### db4free
- Forum: https://www.db4free.net/forum/
- Email: db4free@db4free.net

### Aiven
- Docs: https://docs.aiven.io
- Support: support@aiven.io

---

**Chọn database phù hợp và bắt đầu deploy! 🚀**
