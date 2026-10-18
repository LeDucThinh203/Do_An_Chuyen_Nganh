# 🚀 Deploy Website Node.js Bằng Docker Lên Render.com - HOÀN TOÀN MIỄN PHÍ

## 📋 Mục Lục
1. [Tổng Quan](#tổng-quan)
2. [Chuẩn Bị](#chuẩn-bị)
3. [Deploy Backend](#deploy-backend)
4. [Deploy Frontend](#deploy-frontend)
5. [Deploy Database](#deploy-database)
6. [Kết Nối Các Services](#kết-nối-các-services)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Tổng Quan

**Render.com Free Tier** cung cấp:
- ✅ Web Services (Backend Node.js)
- ✅ Static Sites (Frontend React)
- ✅ PostgreSQL Database (FREE 90 ngày, sau đó $7/tháng)
- Backend hiện dùng PostgreSQL; cấu hình Neon pooled URL trong `DATABASE_URL`.

**Lưu ý Free Tier:**
- Services sẽ sleep sau 15 phút không hoạt động
- Khởi động lại mất ~30-50 giây
- Băng thông: 100GB/tháng
- Build time: 500 phút/tháng

---

## 🔧 Chuẩn Bị

### 1. Push Code Lên GitHub

```powershell
# Tạo .gitignore nếu chưa có
@"
node_modules
.env
npm-debug.log
build
*.log
"@ | Out-File -FilePath .gitignore -Encoding utf8

# Add và commit
git add .
git commit -m "Add Docker configuration for Render deployment"
git push origin main
```

### 2. Tạo Tài Khoản Render
1. Truy cập: https://render.com
2. Sign up bằng GitHub account
3. Authorize Render truy cập repositories

---

## 🗄️ Deploy Database (PostgreSQL)

### Neon PostgreSQL với connection pooling

1. Tạo project PostgreSQL trong Neon.
2. Trong **Connect**, bật **Pooled connection** và sao chép URL. Hostname phải có hậu tố `-pooler`; giữ tham số TLS như `sslmode=require`.
3. Chạy `Database/POSTGRES_RENDER_INIT.sql` trong Neon SQL Editor để tạo schema ban đầu.
4. Trong Render, đặt `DATABASE_URL` bằng URL pooled. Backend hiện đã tạo pool trong `db.js`; không cần thêm file `db_postgres.js`.

Neon dùng PgBouncer ở pooled endpoint. Backend giữ một pool `pg.Pool` dùng chung trong mỗi tiến trình; mặc định tối đa 10 kết nối, idle 30 giây và timeout kết nối 15 giây. Xem [hướng dẫn Neon chi tiết](Backend/my_store_backend/NEON_POSTGRES_GUIDE.md).
## 🔧 Deploy Backend với Docker

### 1. Chuẩn Bị Backend Files

Tạo file `Backend/my_store_backend/render.yaml`:
```yaml
services:
  - type: web
    name: my-store-backend
    env: docker
    dockerfilePath: ./Backend/my_store_backend/Dockerfile
    dockerContext: ./Backend/my_store_backend
    plan: free
    region: singapore
    branch: main
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3006
      - key: DATABASE_URL
        sync: false
      - key: DB_POOL_MAX
        value: 10
      - key: DB_IDLE_TIMEOUT_MS
        value: 30000
      - key: DB_CONN_TIMEOUT_MS
        value: 15000
      - key: JWT_SECRET
        generateValue: true
      - key: GEMINI_API_KEY
        sync: false
```

### 2. Cập Nhật Dockerfile cho Render

File `Backend/my_store_backend/Dockerfile` đã OK, nhưng cần thêm health check:

```dockerfile
# Backend Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Expose port (Render sẽ set PORT env)
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT}/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["npm", "start"]
```

### 3. Thêm Health Check Endpoint

Cập nhật `Backend/my_store_backend/server.js`:
```javascript
// Thêm health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
```

### 4. Deploy Backend trên Render

#### Cách 1: Deploy Từ Dashboard (Đơn Giản)

1. **Tạo Web Service:**
   - Dashboard → New → Web Service
   - Connect Repository → Chọn repo `Do_An_Chuyen_Nganh`
   - Configure:
     ```
     Name: my-store-backend
     Region: Singapore
     Branch: main
     Root Directory: Backend/my_store_backend
     Environment: Docker
     ```

2. **Cấu Hình Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3006
   DATABASE_URL=postgresql://USER:PASSWORD@ep-example-pooler.REGION.aws.neon.tech/DB?sslmode=require
   DB_POOL_MAX=10
   JWT_SECRET=<random-string-32-chars>
   GEMINI_API_KEY=<your-gemini-key>
   ```

3. **Deploy:**
   - Click **Create Web Service**
   - Đợi build (3-5 phút)
   - Nhận URL: `https://my-store-backend.onrender.com`

#### Cách 2: Deploy Bằng Blueprint (Tự Động)

Tạo file `render.yaml` ở root project:
```yaml
services:
  # Backend API
  - type: web
    name: my-store-backend
    env: docker
    dockerfilePath: ./Backend/my_store_backend/Dockerfile
    dockerContext: ./Backend/my_store_backend
    plan: free
    region: singapore
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: DB_POOL_MAX
        value: 10
      - key: DB_IDLE_TIMEOUT_MS
        value: 30000
      - key: DB_CONN_TIMEOUT_MS
        value: 15000
      - key: JWT_SECRET
        generateValue: true
      - key: GEMINI_API_KEY
        sync: false
```

Sau đó:
1. Dashboard → New → Blueprint
2. Connect Repository
3. Render sẽ tự động đọc `render.yaml` và deploy

---

## 🎨 Deploy Frontend

### 1. Chuẩn Bị Frontend

Cập nhật `frontend/src/api.js` để dùng backend URL từ env:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3006';

export default API_BASE_URL;
```

### 2. Deploy Frontend trên Render

#### Option A: Static Site (Khuyến nghị - FREE)

1. **Tạo Static Site:**
   - Dashboard → New → Static Site
   - Connect Repository → `Do_An_Chuyen_Nganh`
   - Configure:
     ```
     Name: my-store-frontend
     Branch: main
     Root Directory: frontend
     Build Command: npm install && npm run build
     Publish Directory: build
     ```

2. **Environment Variables:**
   ```
   REACT_APP_API_URL=https://my-store-backend.onrender.com
   ```

3. **Deploy:**
   - Click **Create Static Site**
   - Nhận URL: `https://my-store-frontend.onrender.com`

#### Option B: Web Service với Docker

Nếu muốn dùng Docker cho frontend:

1. **Tạo Web Service:**
   - Dashboard → New → Web Service
   - Root Directory: `frontend`
   - Environment: Docker

2. **Cấu hình:**
   ```
   Name: my-store-frontend
   Region: Singapore
   Dockerfile Path: ./frontend/Dockerfile
   ```

---

## 🔗 Kết Nối Các Services

### 1. Cập Nhật CORS trên Backend

File `Backend/my_store_backend/server.js`:
```javascript
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:3000',
  'https://my-store-frontend.onrender.com', // Frontend URL
  'https://*.onrender.com' // Allow all Render subdomains
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.some(allowed => 
      allowed.includes('*') ? origin.includes('onrender.com') : origin === allowed
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### 2. Cập Nhật Frontend API URL

File `frontend/src/api.js`:
```javascript
// Tự động detect môi trường
const API_BASE_URL = process.env.REACT_APP_API_URL || 
                     (window.location.hostname.includes('onrender.com') 
                       ? 'https://my-store-backend.onrender.com'
                       : 'http://localhost:3006');

export default API_BASE_URL;
```

---

## 📝 Render Blueprint Hoàn Chỉnh

Tạo file `render.yaml` ở root để deploy tất cả một lúc:

```yaml
services:
  # Backend API
  - type: web
    name: my-store-backend
    env: docker
    dockerfilePath: ./Backend/my_store_backend/Dockerfile
    dockerContext: ./Backend/my_store_backend
    plan: free
    region: singapore
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        sync: false
      - key: DB_POOL_MAX
        value: 10
      - key: DB_IDLE_TIMEOUT_MS
        value: 30000
      - key: DB_CONN_TIMEOUT_MS
        value: 15000
      - key: JWT_SECRET
        generateValue: true
      - key: GEMINI_API_KEY
        sync: false

  # Frontend Static Site
  - type: web
    name: my-store-frontend
    env: static
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: ./frontend/build
    plan: free
    region: singapore
    envVars:
      - key: REACT_APP_API_URL
        value: https://my-store-backend.onrender.com
```

---

## 🚀 Quy Trình Deploy Đầy Đủ

### Bước 1: Chuẩn Bị Database
```powershell
# Tạo project PostgreSQL trên Neon và lấy pooled connection string
# Lưu lại thông tin: host, user, password, database
```

### Bước 2: Import Database Schema
```powershell
# Chạy Database/POSTGRES_RENDER_INIT.sql trong Neon SQL Editor
```

### Bước 3: Push Code Lên GitHub
```powershell
git add .
git commit -m "Ready for Render deployment with Docker"
git push origin main
```

### Bước 4: Deploy trên Render
1. Truy cập https://render.com/dashboard
2. New → Blueprint
3. Connect GitHub repository
4. Chọn repo `Do_An_Chuyen_Nganh`
5. Render tự động đọc `render.yaml`
6. Nhập các Environment Variables còn thiếu
7. Click **Apply**

### Bước 5: Đợi Build Hoàn Tất
- Backend: 3-5 phút
- Frontend: 2-3 phút

### Bước 6: Test Application
```
Frontend: https://my-store-frontend.onrender.com
Backend: https://my-store-backend.onrender.com/health
```

---

## 🐛 Troubleshooting

### 1. Backend Không Start
**Kiểm tra logs:**
- Dashboard → my-store-backend → Logs
- Xem error messages

**Common issues:**
- Environment variables sai
- Database connection failed
- Port conflict (Render dùng PORT env)

**Fix:**
```javascript
// server.js - Đảm bảo dùng PORT từ env
const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 2. Frontend Không Load Backend
**Kiểm tra CORS:**
```javascript
// Backend server.js
app.use(cors({
  origin: ['https://my-store-frontend.onrender.com'],
  credentials: true
}));
```

**Kiểm tra API URL:**
```javascript
// Frontend
console.log('API URL:', process.env.REACT_APP_API_URL);
```

### 3. Database Connection Error
**Test kết nối:**
```javascript
// Thêm vào server.js
import db from './db.js';

app.get('/db-test', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1');
    res.json({ status: 'Database OK', result: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 4. Service Sleep (Free Tier)
Free services sleep sau 15 phút không dùng.

**Giải pháp:**
1. Nâng lên paid plan ($7/tháng)
2. Dùng UptimeRobot để ping mỗi 5 phút:
   - https://uptimerobot.com (FREE)
   - Add monitor: `https://my-store-backend.onrender.com/health`

### 5. Build Failed
**Check build logs để xem lỗi cụ thể:**
- Thiếu dependencies
- Dockerfile syntax error
- Out of memory

**Fix common issues:**
```dockerfile
# Tăng memory cho build
RUN npm install --production --max-old-space-size=2048
```

---

## 💰 Chi Phí

### Hoàn Toàn FREE:
- ✅ Backend Web Service (Free tier)
- ✅ Frontend Static Site (Free tier)
- ✅ Neon PostgreSQL pooled endpoint
- **Total: $0/tháng**

### Optional Paid:
- PostgreSQL: $7/tháng (sau 90 ngày free)
- Nâng cấp không sleep: $7/tháng/service
- Custom domain: FREE trên Render

---

## 📊 Performance Tips

### 1. Optimize Docker Build
```dockerfile
# Cache dependencies
COPY package*.json ./
RUN npm install --production

# Copy app sau (tránh rebuild khi code thay đổi)
COPY . .
```

### 2. Enable Caching
```javascript
// Backend - Cache static responses
app.use(express.static('public', {
  maxAge: '1d',
  etag: true
}));
```

### 3. Compress Responses
```javascript
import compression from 'compression';
app.use(compression());
```

---

## 🔒 Security Checklist

- ✅ Không commit `.env` vào Git
- ✅ Dùng Environment Variables trên Render
- ✅ Enable HTTPS (Render tự động)
- ✅ Đổi tất cả default passwords
- ✅ Validate input data
- ✅ Rate limiting cho API

---

## 🎉 Kết Luận

Bạn đã có:
- ✅ Backend Node.js với Docker
- ✅ Frontend React optimized
- ✅ Neon PostgreSQL qua DATABASE_URL
- ✅ Tất cả chạy MIỄN PHÍ trên Render
- ✅ Auto deploy khi push Git
- ✅ HTTPS miễn phí
- ✅ CDN cho static files

**URL sau khi deploy:**
- Frontend: `https://my-store-frontend.onrender.com`
- Backend: `https://my-store-backend.onrender.com`

**Chúc bạn deploy thành công! 🚀**
