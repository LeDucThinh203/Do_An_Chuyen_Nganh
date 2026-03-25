# 🏪 My Store - Website Bán Đồ Bóng Đá

> **E-commerce platform với AI Chatbot** - Node.js + React + MySQL + Docker

[![Deploy on Render](https://img.shields.io/badge/Deploy-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

## 📖 Giới Thiệu

Website thương mại điện tử bán đồ bóng đá với tích hợp AI chatbot thông minh, hỗ trợ tìm kiếm sản phẩm và tư vấn khách hàng.

### ✨ Tính Năng Chính

- 🛒 **E-commerce đầy đủ**: Giỏ hàng, đặt hàng, thanh toán
- 🤖 **AI Chatbot**: Tư vấn sản phẩm bằng Google Gemini
- 🔐 **Authentication**: Đăng ký, đăng nhập, JWT tokens
- 📦 **Quản lý sản phẩm**: CRUD products, categories, sizes
- 💳 **Thanh toán**: Tích hợp VNPay
- 📊 **Admin Dashboard**: Quản lý đơn hàng, sản phẩm
- 🔍 **Tìm kiếm thông minh**: Vector embeddings search
- 📱 **Responsive**: Mobile-friendly UI

---

## 🚀 DEPLOY NHANH (5 phút)

### ⚡ Quick Start

```powershell
# 1. Chạy script chuẩn bị
.\prepare-deploy.ps1

# 2. Làm theo hướng dẫn trong script

# 3. Deploy lên Render.com (xem hướng dẫn bên dưới)
```

### 📚 Tài Liệu Deploy

| File | Mô Tả | Thời Gian |
|------|-------|-----------|
| **[DEPLOY_INDEX.md](./DEPLOY_INDEX.md)** | 📌 BẮT ĐẦU TỪ ĐÂY - Index tất cả tài liệu | 2 min |
| **[QUICK_START_RENDER.md](./QUICK_START_RENDER.md)** | ⚡ Deploy nhanh lên Render | 5 min |
| **[DEPLOY_RENDER_DOCKER.md](./DEPLOY_RENDER_DOCKER.md)** | 📘 Hướng dẫn chi tiết deploy | 15 min |
| **[DEPLOY_NETLIFY_FULL.md](./DEPLOY_NETLIFY_FULL.md)** | 🌐 Deploy frontend lên Netlify (full flow) | 10 min |
| **[DOCKER_DEPLOYMENT_GUIDE.md](./DOCKER_DEPLOYMENT_GUIDE.md)** | 🐳 Deploy local với Docker | 10 min |
| **[DATABASE_OPTIONS.md](./DATABASE_OPTIONS.md)** | 🗄️ Chọn database miễn phí | 5 min |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | 🏗️ Kiến trúc hệ thống | 10 min |
| **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** | ✅ Checklist từng bước | Print & Use |

---

## 💻 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express 5
- **Database**: MySQL 8.0
- **ORM**: mysql2 (raw queries + prepared statements)
- **Auth**: JWT + bcryptjs
- **AI**: Google Gemini API
- **API Docs**: Swagger/OpenAPI

### Frontend
- **Library**: React 19
- **UI**: React Bootstrap
- **Routing**: React Router v7
- **State**: React Hooks
- **HTTP Client**: Axios

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Deployment**: Render.com
- **Web Server**: Nginx (frontend)

---

## 📁 Cấu Trúc Project

```
Do_An_Chuyen_Nganh/
├── Backend/my_store_backend/      # Node.js API
│   ├── controllers/               # Request handlers
│   ├── routes/                    # API routes
│   ├── services/ai/               # AI chatbot logic
│   ├── repositories/              # Database access
│   ├── middleware/                # Auth, validation
│   ├── scripts/                   # Utility scripts
│   ├── Dockerfile                 # Backend container
│   └── server.js                  # Entry point
│
├── frontend/                      # React App
│   ├── src/
│   │   ├── view/                  # Components
│   │   ├── Session/               # Auth helpers
│   │   └── api.js                 # API client
│   ├── public/                    # Static assets
│   ├── Dockerfile                 # Frontend container
│   └── nginx.conf                 # Nginx config
│
├── Database/                      # SQL schemas
│   ├── DBWebBanDoBongDa.sql      # Main schema
│   └── AI_Schema.sql             # AI tables
│
├── docker-compose.yml             # Local dev setup
├── render.yaml                    # Render blueprint
└── 📚 DEPLOY_*.md                # Documentation
```

---

## 🛠️ Development

### Yêu Cầu
- Node.js 18+
- MySQL 8.0+ (hoặc database free online)
- Docker (optional, cho local dev)
- Git

### Setup Local

#### 1. Clone Repository
```powershell
git clone https://github.com/LeDucThinh203/Do_An_Chuyen_Nganh.git
cd Do_An_Chuyen_Nganh
```

#### 2. Setup Backend
```powershell
cd Backend/my_store_backend

# Copy environment template
Copy-Item .env.example .env

# Edit .env with your database credentials
notepad .env

# Install dependencies
npm install

# Test database connection
node scripts/test_db_connection.js

# Start server
npm start
# Server chạy tại: http://localhost:3006
```

#### 3. Setup Frontend
```powershell
cd frontend

# Install dependencies
npm install

# Start development server
npm start
# App chạy tại: http://localhost:3000
```

#### 4. Setup Database
- Đăng ký database miễn phí tại [FreeSQLDatabase.com](https://www.freesqldatabase.com)
- Import file `Database/DBWebBanDoBongDa.sql`
- Xem chi tiết: [DATABASE_OPTIONS.md](./DATABASE_OPTIONS.md)

---

## 🐳 Docker (Khuyến Nghị)

### Run với Docker Compose

```powershell
# Start tất cả services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Services:**
- Frontend: http://localhost
- Backend: http://localhost:3006
- Database: localhost:3307
- Swagger: http://localhost:3006/swagger

Xem chi tiết: [DOCKER_DEPLOYMENT_GUIDE.md](./DOCKER_DEPLOYMENT_GUIDE.md)

---

## 🌐 Deploy lên Render.com (FREE)

### Option 1: Auto Deploy (Blueprint)

1. Truy cập [Render Dashboard](https://dashboard.render.com)
2. **New** → **Blueprint**
3. Connect repo `Do_An_Chuyen_Nganh`
4. Nhập Environment Variables
5. Click **Apply**

### Option 2: Manual Deploy

Xem hướng dẫn chi tiết: [QUICK_START_RENDER.md](./QUICK_START_RENDER.md)

### 💰 Chi Phí: $0/tháng
- ✅ Backend Web Service (Free tier)
- ✅ Frontend Static Site (Free tier)  
- ✅ MySQL Database (FreeSQLDatabase.com)
- ✅ HTTPS auto SSL
- ✅ Auto deploy from Git

---

## 📚 API Documentation

Sau khi start server, truy cập:
- **Swagger UI**: http://localhost:3006/swagger
- **Live API**: https://your-backend.onrender.com/swagger

### Main Endpoints

```
Authentication
POST   /api/auth/register    # Đăng ký
POST   /api/auth/login        # Đăng nhập

Products
GET    /api/products          # Lấy danh sách sản phẩm
GET    /api/products/:id      # Chi tiết sản phẩm
POST   /api/products          # Tạo sản phẩm (admin)

AI Chatbot
POST   /api/ai/chat           # Chat với AI
POST   /api/ai/suggestions    # Gợi ý sản phẩm

Orders
GET    /api/orders            # Đơn hàng của user
POST   /api/orders            # Tạo đơn hàng

Health Check
GET    /health                # Server status
```

---

## 🔐 Environment Variables

### Backend (.env)
```env
# Database
DB_HOST=your-database-host
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=your-database
DB_PORT=3306

# Authentication
JWT_SECRET=your-random-secret-32-chars-minimum

# AI
GEMINI_API_KEY=your-gemini-api-key

# Server
PORT=3006
NODE_ENV=development
```

### Frontend
```env
REACT_APP_API_URL=http://localhost:3006
```

Xem template: `Backend/my_store_backend/.env.example`

---

## 🧪 Testing

### Test Database Connection
```powershell
cd Backend/my_store_backend
node scripts/test_db_connection.js
```

### Test API Endpoints
```powershell
# Health check
curl http://localhost:3006/health

# Get products
curl http://localhost:3006/api/products
```

### Test Frontend
```powershell
cd frontend
npm test
```

---

## 📊 Features Demo

### 🤖 AI Chatbot
- Vector search với embeddings
- Natural language processing
- Product recommendations
- Context-aware responses

### 🛒 E-commerce
- Product catalog với filters
- Shopping cart
- Order management
- Payment integration (VNPay)

### 👤 User Management
- Registration/Login
- JWT authentication
- Role-based access (User/Admin)
- Profile management

---

## 🐛 Troubleshooting

### Common Issues

**Backend không start?**
```powershell
# Check database connection
node scripts/test_db_connection.js

# Verify .env file
cat Backend/my_store_backend/.env
```

**Frontend không kết nối backend?**
```javascript
// Check REACT_APP_API_URL trong .env
console.log(process.env.REACT_APP_API_URL)
```

**Docker issues?**
```powershell
# Rebuild containers
docker-compose down
docker-compose up -d --build
```

Xem thêm: [DEPLOY_RENDER_DOCKER.md](./DEPLOY_RENDER_DOCKER.md) → Troubleshooting

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork repo
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open Pull Request

---

## 📄 License

MIT License - Free to use for personal and commercial projects.

---

## 👨‍💻 Authors

- **LeDucThinh203** - [GitHub](https://github.com/LeDucThinh203)

---

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- Render.com for free hosting
- FreeSQLDatabase.com for free MySQL
- Open source community

---

## 📞 Support

### 📚 Documentation
- [Deployment Index](./DEPLOY_INDEX.md) - Tất cả tài liệu deploy
- [Quick Start](./QUICK_START_RENDER.md) - Deploy nhanh 5 phút
- [Architecture](./ARCHITECTURE.md) - System design

### 🐛 Issues
- Report bugs: [GitHub Issues](https://github.com/LeDucThinh203/Do_An_Chuyen_Nganh/issues)
- Feature requests welcome!

### 📧 Contact
- GitHub: [@LeDucThinh203](https://github.com/LeDucThinh203)
- Email: (Add your email if public)

---

## 🎯 Roadmap

- [x] Basic e-commerce features
- [x] AI chatbot integration
- [x] Docker containerization
- [x] Render.com deployment
- [ ] Payment gateway (VNPay) completion
- [ ] Admin dashboard enhancements
- [ ] Mobile app (React Native)
- [ ] Real-time notifications
- [ ] Analytics dashboard

---

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

**🚀 Ready to deploy? Start with [DEPLOY_INDEX.md](./DEPLOY_INDEX.md)!**
