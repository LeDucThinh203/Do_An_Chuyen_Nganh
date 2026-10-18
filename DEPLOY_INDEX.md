# 📚 INDEX - Tài Liệu Deploy

## 🎯 BẮT ĐẦU TỪ ĐÂY

### 1. Đọc tổng quan trước:
→ **[DEPLOY_SUMMARY.md](./DEPLOY_SUMMARY.md)** - Tóm tắt toàn bộ

### 2. Chạy script chuẩn bị:
```powershell
.\prepare-deploy.ps1
```

### 3. Chọn hướng dẫn phù hợp:

---

## 📖 Hướng Dẫn Deploy

### ⚡ Deploy Nhanh (5 phút)
**[QUICK_START_RENDER.md](./QUICK_START_RENDER.md)**
- Các bước cơ bản nhất
- Checklist deploy
- Troubleshooting nhanh

### 📘 Hướng Dẫn Chi Tiết
**[DEPLOY_RENDER_DOCKER.md](./DEPLOY_RENDER_DOCKER.md)**
- Giải thích từng bước
- Best practices
- Security checklist
- Performance tips
- Production deployment

### 🐳 Deploy Local với Docker
**[DOCKER_DEPLOYMENT_GUIDE.md](./DOCKER_DEPLOYMENT_GUIDE.md)**
- Docker Compose setup
- Quản lý containers
- Database backup/restore
- Troubleshooting Docker

---

## 🗄️ Database

### 🆓 Chọn Database Miễn Phí
**[DATABASE_OPTIONS.md](./DATABASE_OPTIONS.md)**
- Hướng dẫn Neon PostgreSQL và connection pool
- Hướng dẫn đăng ký từng service
- Cấu hình DATABASE_URL pooled có hậu tố -pooler
- Import/Export database

---

## 🔧 Files Cấu Hình

### Docker
- `Backend/my_store_backend/Dockerfile` - Backend image
- `frontend/Dockerfile` - Frontend multi-stage build
- `docker-compose.yml` - Local development
- `render.yaml` - Render Blueprint

### Environment
- `Backend/my_store_backend/.env.example` - Template
- `.env.example` - Root template

### Scripts
- `prepare-deploy.ps1` - Deployment helper
- `Backend/my_store_backend/scripts/test_db_connection.js` - Test DB

---

## 🎯 Workflow Đề Xuất

```
📖 Đọc DEPLOY_SUMMARY.md
    ↓
🏃 Chạy prepare-deploy.ps1
    ↓
🗄️ Chọn database (xem DATABASE_OPTIONS.md)
    ↓
⚡ Follow QUICK_START_RENDER.md
    ↓
🎉 Website LIVE!
```

---

## 🆘 Khi Gặp Vấn Đề

### Backend Issues
1. Check `DEPLOY_RENDER_DOCKER.md` → Troubleshooting
2. Run `test_db_connection.js`
3. Check Render logs

### Frontend Issues
1. Verify `REACT_APP_API_URL`
2. Check browser console (F12)
3. Test backend `/health` endpoint

### Database Issues
1. See `DATABASE_OPTIONS.md` → Troubleshooting
2. Test connection local
3. Verify credentials

### Docker Issues
1. See `DOCKER_DEPLOYMENT_GUIDE.md` → Troubleshooting
2. Check `docker-compose logs`
3. Rebuild images

---

## 📞 Quick Links

### Render
- [Dashboard](https://dashboard.render.com)
- [Docs](https://render.com/docs)
- [Status](https://status.render.com)

### Database
- [FreeSQLDatabase](https://www.freesqldatabase.com)
- [db4free](https://www.db4free.net)
- [Aiven](https://aiven.io)

### Tools
- [Docker](https://www.docker.com)
- [UptimeRobot](https://uptimerobot.com) - Keep services alive

---

## 💡 Tips

- 📱 Bookmark trang này để dễ tìm tài liệu
- 🔖 Star các links quan trọng
- 📝 Note lại URLs sau khi deploy
- 💾 Backup database định kỳ

---

**Happy Deploying! 🚀**

*Tất cả tài liệu đều bằng tiếng Việt, dễ hiểu, có ví dụ cụ thể.*
