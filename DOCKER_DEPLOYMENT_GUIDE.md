# 🐳 Hướng Dẫn Deploy Ứng Dụng Bằng Docker

## 📋 Mục Lục
1. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
2. [Cài Đặt Docker](#cài-đặt-docker)
3. [Cấu Hình](#cấu-hình)
4. [Deploy Ứng Dụng](#deploy-ứng-dụng)
5. [Quản Lý Containers](#quản-lý-containers)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Yêu Cầu Hệ Thống

- **Docker**: Version 20.10 trở lên
- **Docker Compose**: Version 2.0 trở lên
- **RAM**: Tối thiểu 4GB (khuyến nghị 8GB)
- **Disk Space**: Tối thiểu 10GB trống

---

## 📦 Cài Đặt Docker

### Windows:
1. Download **Docker Desktop** từ: https://www.docker.com/products/docker-desktop
2. Cài đặt và khởi động Docker Desktop
3. Kiểm tra cài đặt:
```powershell
docker --version
docker-compose --version
```

### Linux (Ubuntu/Debian):
```bash
# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Cài đặt Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Thêm user vào group docker
sudo usermod -aG docker $USER
```

---

## ⚙️ Cấu Hình

### 1. Tạo File Environment
Copy file `.env.example` thành `.env`:
```powershell
Copy-Item .env.example .env
```

### 2. Chỉnh Sửa File `.env`
Mở file `.env` và cập nhật các giá trị:
```env
# Database Configuration
# Leave DATABASE_URL blank to use the local PostgreSQL container.
# To use Neon, set its pooled connection URL (hostname contains -pooler).
DATABASE_URL=
POSTGRES_DB=DBWebBanDoBongDa
POSTGRES_USER=admin
POSTGRES_PASSWORD=change-me-locally
DB_POOL_MAX=10
DB_IDLE_TIMEOUT_MS=30000
DB_CONN_TIMEOUT_MS=15000

# Backend Configuration
JWT_SECRET=your-secret-key-change-this-in-production
GEMINI_API_KEY=your-actual-gemini-api-key

# Port Configuration
BACKEND_PORT=3006
FRONTEND_PORT=80
```

⚠️ **Quan trọng**: Đổi các giá trị mật khẩu và secret key trong môi trường production!

---

## 🚀 Deploy Ứng Dụng

### Khởi Động Toàn Bộ Hệ Thống

```powershell
# Build và start tất cả services
docker-compose up -d --build
```

**Các services sẽ được khởi động:**
- ✅ **PostgreSQL Database** - Port 5432
- ✅ **Backend API** - Port 3006
- ✅ **Frontend React** - Port 80

### Kiểm Tra Trạng Thái

```powershell
# Xem logs của tất cả services
docker-compose logs -f

# Xem logs của một service cụ thể
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database

# Kiểm tra container đang chạy
docker-compose ps
```

### Truy Cập Ứng Dụng

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3006
- **Database**: localhost:5432

---

## 🔧 Quản Lý Containers

### Dừng Ứng Dụng
```powershell
# Dừng tất cả services
docker-compose down

# Dừng và xóa volumes (database data)
docker-compose down -v
```

### Khởi Động Lại
```powershell
# Khởi động lại tất cả services
docker-compose restart

# Khởi động lại một service cụ thể
docker-compose restart backend
```

### Rebuild Sau Khi Thay Đổi Code
```powershell
# Rebuild một service cụ thể
docker-compose up -d --build backend

# Rebuild tất cả
docker-compose up -d --build
```

### Xem Logs
```powershell
# Real-time logs
docker-compose logs -f

# Logs của 1 service
docker-compose logs -f backend

# 100 dòng logs cuối
docker-compose logs --tail=100 backend
```

### Truy Cập Container Shell
```powershell
# Truy cập backend container
docker-compose exec backend sh

# Truy cập database container
docker-compose exec database psql -U admin -d DBWebBanDoBongDa

# Truy cập frontend container
docker-compose exec frontend sh
```

---

## 🗄️ Quản Lý Database

### Import Database Ban Đầu
A fresh local PostgreSQL volume runs `Database/POSTGRES_RENDER_INIT.sql` once during initialization.

### Backup Database
```powershell
# Backup database
# Use Neon’s direct/unpooled connection URL for pg_dump.
pg_dump "$env:DATABASE_URL_UNPOOLED" --format=custom --file="backup.dump"
```

### Restore Database
```powershell
# Restore từ backup
pg_restore --clean --if-exists --dbname="$env:DATABASE_URL_UNPOOLED" backup.dump
```

### Kết Nối Database Từ Máy Local
```
Host: localhost
Port: 5432
User: admin
Password: `POSTGRES_PASSWORD` trong `.env`
Database: DBWebBanDoBongDa
```

---

## 🐛 Troubleshooting

### Container Không Khởi Động
```powershell
# Xem logs chi tiết
docker-compose logs backend

# Kiểm tra health check
docker-compose ps
```

### Port Đã Được Sử Dụng
Nếu port 80, 3006, hoặc 5432 đã được sử dụng, chỉnh sửa trong `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Đổi port frontend thành 8080
  - "3007:3006"  # Đổi port backend thành 3007
```

### Database Connection Error
1. Kiểm tra database container đã healthy:
```powershell
docker-compose ps database
```

2. Kiểm tra logs:
```powershell
docker-compose logs database
```

3. Verify environment variables:
```powershell
docker-compose exec backend env | Select-String DB_
```

### Xóa Toàn Bộ và Bắt Đầu Lại
```powershell
# Dừng và xóa tất cả
docker-compose down -v

# Xóa images
docker-compose down --rmi all

# Khởi động lại từ đầu
docker-compose up -d --build
```

### Kiểm Tra Disk Space
```powershell
# Xem dung lượng Docker đang sử dụng
docker system df

# Cleanup unused images, containers, volumes
docker system prune -a --volumes
```

---

## 📊 Monitoring và Performance

### Xem Resource Usage
```powershell
# Xem CPU, RAM usage của containers
docker stats

# Xem của một container cụ thể
docker stats my_store_backend
```

### Health Check
```powershell
# Kiểm tra health status
docker-compose ps

# Inspect health check
docker inspect my_store_db | Select-String -Pattern "Health"
```

---

## 🔒 Security Best Practices

1. **Không commit file `.env`** vào Git
2. **Đổi tất cả default passwords** trong production
3. **Sử dụng strong JWT_SECRET** (tối thiểu 32 ký tự random)
4. **Backup database định kỳ**
5. **Update Docker images thường xuyên**

---

## 🌐 Deploy lên Production Server

### 1. Chuẩn Bị Server
- Cài đặt Docker và Docker Compose
- Mở các ports cần thiết (80, 443, 3006)
- Cấu hình firewall

### 2. Clone Code
```bash
git clone <your-repo-url>
cd Do_An_Chuyen_Nganh
```

### 3. Cấu Hình Production
```bash
cp .env.example .env
nano .env  # Chỉnh sửa với giá trị production
```

### 4. Deploy
```bash
docker-compose up -d --build
```

### 5. Cấu Hình HTTPS (Optional)
Sử dụng nginx-proxy hoặc Traefik với Let's Encrypt cho SSL certificates.

---

## 📝 Useful Commands Cheat Sheet

```powershell
# Start
docker-compose up -d

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build

# Logs
docker-compose logs -f [service_name]

# Restart
docker-compose restart [service_name]

# Shell access
docker-compose exec [service_name] sh

# Database backup
docker-compose exec database pg_dump -U admin -Fc DBWebBanDoBongDa > backup.dump

# View running containers
docker-compose ps

# View resource usage
docker stats

# Clean up
docker system prune -a
```

---

## 🆘 Support

Nếu gặp vấn đề, kiểm tra:
1. Docker Desktop đang chạy
2. File `.env` đã được cấu hình đúng
3. Ports không bị conflict
4. Đủ disk space và RAM

Xem logs chi tiết để debug:
```powershell
docker-compose logs -f
```

---

**Chúc bạn deploy thành công! 🎉**
