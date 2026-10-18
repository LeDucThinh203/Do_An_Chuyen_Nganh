# ✅ DEPLOYMENT CHECKLIST

Sử dụng checklist này để đảm bảo không bỏ sót bước nào trong quá trình deploy.

---

## 📋 Phase 1: Chuẩn Bị (30 phút)

### 🗄️ Database Setup
- [ ] Create a PostgreSQL project in Neon
- [ ] Copy the pooled connection string (hostname includes `-pooler` and URL includes `sslmode=require`)
- [ ] Run `Database/POSTGRES_RENDER_INIT.sql` in Neon SQL Editor
- [ ] Set `DATABASE_URL` in the backend environment
- [ ] Keep pool limits appropriate for backend instance count

### 🔑 Environment Variables
- [ ] Copy `.env.example` thành `.env`
- [ ] Điền thông tin database vào `.env`
- [ ] Generate JWT_SECRET (chạy `prepare-deploy.ps1` hoặc random 32 chars)
- [ ] Thêm GEMINI_API_KEY (lấy từ https://ai.google.dev)
- [ ] Verify tất cả biến môi trường cần thiết đã có

### 🧪 Local Testing
- [ ] Test database connection:
  ```powershell
  node Backend\my_store_backend\scripts\test_db_connection.js
  ```
- [ ] Result: ✅ "PostgreSQL connection is healthy."
- [ ] (Optional) Test local với Docker:
  ```powershell
  docker-compose up -d
  ```
- [ ] (Optional) Verify localhost:3006/health returns 200

---

## 📋 Phase 2: GitHub Setup (10 phút)

### 📦 Code Preparation
- [ ] Verify tất cả Docker files tồn tại:
  - [ ] `Backend/my_store_backend/Dockerfile`
  - [ ] `Backend/my_store_backend/.dockerignore`
  - [ ] `frontend/Dockerfile`
  - [ ] `frontend/.dockerignore`
  - [ ] `frontend/nginx.conf`
  - [ ] `render.yaml`
- [ ] Verify `.gitignore` không commit `.env`
- [ ] Verify code không có errors

### 🔄 Git Push
- [ ] Check git status: `git status`
- [ ] Stage all changes: `git add .`
- [ ] Commit: `git commit -m "Ready for Render deployment"`
- [ ] Push to GitHub: `git push origin main`
- [ ] Verify push thành công (check GitHub repo)

---

## 📋 Phase 3: Render Setup (15 phút)

### 🎯 Account Setup
- [ ] Truy cập https://render.com
- [ ] Sign up/Login bằng GitHub
- [ ] Authorize Render truy cập GitHub repos
- [ ] Verify có thể thấy repo `Do_An_Chuyen_Nganh`

### 🚀 Backend Service
- [ ] Dashboard → New → Web Service (hoặc Blueprint)
- [ ] Connect repository: `Do_An_Chuyen_Nganh`
- [ ] Configure backend:
  - [ ] Name: `my-store-backend`
  - [ ] Region: **Singapore** (gần VN)
  - [ ] Branch: `main`
  - [ ] Root Directory: `Backend/my_store_backend`
  - [ ] Environment: **Docker**
  - [ ] Dockerfile Path: `./Backend/my_store_backend/Dockerfile`

### 🔐 Backend Environment Variables
Nhập vào Render Dashboard (Environment tab):

- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `10000`
- [ ] `DATABASE_URL` = Neon pooled connection string (hostname includes `-pooler`)
- [ ] `DB_POOL_MAX` = `10` (per backend process)
- [ ] `DB_IDLE_TIMEOUT_MS` = `30000`
- [ ] `DB_CONN_TIMEOUT_MS` = `15000`
- [ ] `JWT_SECRET` = `<random-32-chars>`
- [ ] `GEMINI_API_KEY` = `<your-gemini-key>`

- [ ] Click **Create Web Service** / **Save Changes**
- [ ] Wait for build (3-5 phút)
- [ ] Check logs: No errors
- [ ] Copy Backend URL: `https://__________________.onrender.com`
- [ ] Test health endpoint: `https://your-backend.onrender.com/health`
- [ ] Result: ✅ `{"status":"OK",...}`

### 🎨 Frontend Service
- [ ] Dashboard → New → Static Site
- [ ] Connect repository: `Do_An_Chuyen_Nganh`
- [ ] Configure frontend:
  - [ ] Name: `my-store-frontend`
  - [ ] Region: **Singapore**
  - [ ] Branch: `main`
  - [ ] Root Directory: `frontend`
  - [ ] Build Command: `npm install && npm run build`
  - [ ] Publish Directory: `build`

### 🔗 Frontend Environment Variables
- [ ] `REACT_APP_API_URL` = `https://your-backend.onrender.com`
  - ⚠️ **Thay bằng Backend URL thực tế từ bước trước!**

- [ ] Click **Create Static Site**
- [ ] Wait for build (2-3 phút)
- [ ] Check logs: Build successful
- [ ] Copy Frontend URL: `https://__________________.onrender.com`

---

## 📋 Phase 4: Verification (10 phút)

### 🧪 Backend Testing
- [ ] Visit: `https://your-backend.onrender.com`
- [ ] Should see: "My Store API is running"
- [ ] Visit: `https://your-backend.onrender.com/health`
- [ ] Should see: `{"status":"OK",...}`
- [ ] Visit: `https://your-backend.onrender.com/swagger`
- [ ] Should see: API Documentation (Swagger UI)
- [ ] Test an endpoint (e.g., GET /api/categories)
- [ ] Result: ✅ Returns data

### 🌐 Frontend Testing
- [ ] Visit: `https://your-frontend.onrender.com`
- [ ] Should see: Homepage loads
- [ ] Check browser console (F12): No errors
- [ ] Test navigation: Click around pages
- [ ] Test product listing: Products display
- [ ] Test search: Search works

### 🔐 Authentication Testing
- [ ] Test Register:
  - [ ] Create new account
  - [ ] Receive success message
- [ ] Test Login:
  - [ ] Login with credentials
  - [ ] Redirected to homepage
  - [ ] User menu shows
- [ ] Test Protected Routes:
  - [ ] Access cart (logged in)
  - [ ] Access profile (logged in)

### 🤖 AI Testing (If applicable)
- [ ] Open chat interface
- [ ] Send test message: "Xin chào"
- [ ] Receive AI response
- [ ] Send product query: "Tìm áo MU"
- [ ] Receive product recommendations

### 📦 E-commerce Flow Testing
- [ ] Browse products
- [ ] View product details
- [ ] Add to cart
- [ ] View cart
- [ ] Update quantities
- [ ] (Optional) Test checkout

---

## 📋 Phase 5: Post-Deployment (Optional)

### 🔒 Security
- [ ] Verify HTTPS works (🔒 icon in browser)
- [ ] Check CORS: Frontend can call backend
- [ ] Review environment variables: No secrets exposed
- [ ] (Optional) Enable Render RBAC
- [ ] (Optional) Add IP whitelist

### 📊 Monitoring
- [ ] Setup UptimeRobot (https://uptimerobot.com):
  - [ ] Monitor: `https://your-backend.onrender.com/health`
  - [ ] Interval: 5 minutes
  - [ ] Alert: Email when down
- [ ] (Optional) Setup Render notifications:
  - [ ] Settings → Notifications
  - [ ] Enable email alerts

### 🌐 Custom Domain (Optional)
- [ ] Buy domain (Namecheap, GoDaddy, etc.)
- [ ] Render → Settings → Custom Domains
- [ ] Add domain
- [ ] Update DNS records:
  - [ ] Add CNAME: `www` → `your-app.onrender.com`
  - [ ] Add A record: `@` → Render IP
- [ ] Wait for DNS propagation (5-30 min)
- [ ] Verify domain works with HTTPS

### 📝 Documentation
- [ ] Update README with live URLs
- [ ] Document environment variables
- [ ] Add deployment notes
- [ ] (Optional) Create user guide

### 💾 Backup
- [ ] Backup database:
  ```bash
  pg_dump "$env:DATABASE_URL_UNPOOLED" --format=custom --file=backup.dump
  ```
- [ ] Store backup securely (Google Drive, GitHub private repo)
- [ ] Setup automated backup script
- [ ] Test restore procedure

---

## 📋 Phase 6: Maintenance

### 🔄 Regular Tasks
- [ ] Check service health weekly
- [ ] Monitor database size
- [ ] Review logs for errors
- [ ] Update dependencies monthly:
  - [ ] `npm outdated`
  - [ ] `npm update`
  - [ ] Test locally
  - [ ] Push to GitHub (auto-deploy)

### 🐛 If Issues Occur
- [ ] Check Render logs:
  - Dashboard → Service → Logs
- [ ] Test locally with Docker
- [ ] Review environment variables
- [ ] Check database connection
- [ ] See `DEPLOY_RENDER_DOCKER.md` → Troubleshooting

---

## 🎉 Success Criteria

### ✅ Deployment Successful When:
- [x] Backend health returns 200 OK
- [x] Frontend loads without errors
- [x] Database connection works
- [x] Users can register/login
- [x] Products display correctly
- [x] API endpoints respond
- [x] HTTPS enabled
- [x] No console errors

### 🎯 Performance Goals:
- [ ] Frontend loads < 3 seconds
- [ ] API response < 500ms
- [ ] No memory leaks
- [ ] Services stay awake (or wake quickly)

---

## 📞 Support Contacts

### Render
- Dashboard: https://dashboard.render.com
- Docs: https://render.com/docs
- Status: https://status.render.com
- Support: support@render.com

### Database
- Neon PostgreSQL: https://neon.com/docs/connect/connection-pooling



---

## 📝 Notes Section

**Backend URL:**
```
https://_____________________________________.onrender.com
```

**Frontend URL:**
```
https://_____________________________________.onrender.com
```

**Database Host:**
```
Neon pooled DATABASE_URL: __________________________________________
```

**Deployment Date:**
```
Date: ____/____/________
Time: ____:____
```

**Issues Encountered:**
```
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________
```

**Solutions:**
```
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________
```

---

## 🎓 Next Steps After Successful Deploy

- [ ] Share URLs with team/friends
- [ ] Add to portfolio
- [ ] Setup analytics (Google Analytics)
- [ ] Setup error tracking (Sentry)
- [ ] Plan new features
- [ ] Collect user feedback
- [ ] Scale if needed

---

**🎉 Congratulations on your deployment!**

*Print this checklist và đánh dấu ✅ từng bước để đảm bảo deploy thành công!*
