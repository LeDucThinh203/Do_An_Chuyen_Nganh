# 📦 Large-Scale Product Catalog Guide

## Vấn đề khi có 1000+ sản phẩm

### ⚠️ Thách thức:
1. **Rate Limiting**: Gemini API giới hạn requests/phút
2. **Startup Delay**: Tạo embeddings khi start server mất nhiều thời gian
3. **Memory Usage**: Cache nhiều embeddings tốn RAM

---

## ✅ Giải pháp theo quy mô

### 📊 Nhỏ (< 100 sản phẩm)
**Setup:**
```bash
# .env
EMBEDDING_STARTUP_BATCH=100
EMBEDDING_CONCURRENT_LIMIT=5
EMBEDDING_BATCH_DELAY=500
```

**Workflow:**
```bash
npm start  # Auto-generate tất cả khi start
```

**Kết quả:** 
- Startup: ~30-60 giây
- Chat response: 1-2 giây ⚡

---

### 📈 Trung bình (100-500 sản phẩm)
**Setup:**
```bash
# .env
EMBEDDING_STARTUP_BATCH=50
EMBEDDING_CONCURRENT_LIMIT=3
EMBEDDING_BATCH_DELAY=1000
```

**Workflow:**
```bash
# Lần đầu setup
node scripts/generate_embeddings.js  # 5-15 phút

# Sau đó
npm start  # Generate 50 sản phẩm thiếu (nếu có)
```

**Kết quả:**
- Startup: ~10-20 giây (chỉ generate 50)
- Chat response: 2-3 giây
- ETA generate all: 10-15 phút

---

### 🚀 Lớn (500-5,000 sản phẩm)
**Setup:**
```bash
# .env
EMBEDDING_STARTUP_BATCH=20
EMBEDDING_CONCURRENT_LIMIT=3
EMBEDDING_BATCH_DELAY=2000
```

**Workflow:**
```bash
# REQUIRED: Chạy script trước
node scripts/generate_embeddings.js
# ETA: 30-90 phút tùy Gemini API tier

# Sau khi hoàn tất
npm start  # Fast startup (chỉ generate 20 thiếu)
```

**Kết quả:**
- Startup: ~5-10 giây
- Chat response: 2-4 giây
- Generate all: 30-90 phút (1 lần duy nhất)

**Khuyến nghị:**
- Chạy script **ngoài giờ cao điểm** (đêm/cuối tuần)
- Monitor tiến trình trong console
- Upgrade Gemini API tier nếu cần nhanh hơn

---

### 🏢 Enterprise (5,000+ sản phẩm)
**Setup:**
```bash
# .env
EMBEDDING_STARTUP_BATCH=0  # Disable auto-generation
EMBEDDING_CONCURRENT_LIMIT=10  # Paid tier
EMBEDDING_BATCH_DELAY=500
```

**Workflow:**
```bash
# 1. Generate embeddings offline (background job)
node scripts/generate_embeddings.js
# ETA: 2-8 giờ

# 2. Setup cron job cho sản phẩm mới
# Linux/Mac: Add to crontab
0 2 * * * cd /path/to/backend && node scripts/generate_embeddings.js

# Windows: Use Task Scheduler
# Chạy daily lúc 2:00 AM
```

**Production considerations:**
```bash
# 1. Dedicated embedding service (optional)
# Tách riêng service generate embeddings

# 2. Queue system (Redis + Bull)
# Queue sản phẩm mới → generate async

# 3. Batch processing
# Generate embeddings theo batch nhỏ mỗi ngày
```

**Kết quả:**
- Startup: instant (không generate)
- Chat response: 1-3 giây
- New products: Generate via cron job

---

## 📋 Checklist theo quy mô

### < 100 sản phẩm:
- [x] Set `EMBEDDING_STARTUP_BATCH=100`
- [x] `npm start` → Ready!

### 100-500 sản phẩm:
- [x] Set `EMBEDDING_STARTUP_BATCH=50`
- [x] Chạy `node scripts/generate_embeddings.js` (1 lần)
- [x] `npm start` → Ready!

### 500-5,000 sản phẩm:
- [x] Set `EMBEDDING_STARTUP_BATCH=20`
- [x] **REQUIRED:** Chạy `node scripts/generate_embeddings.js`
- [x] Đợi hoàn tất (~30-90 phút)
- [x] `npm start` → Ready!
- [ ] Consider Gemini API paid tier

### 5,000+ sản phẩm:
- [x] Set `EMBEDDING_STARTUP_BATCH=0`
- [x] Upgrade to Gemini API paid tier
- [x] Chạy `node scripts/generate_embeddings.js` (background)
- [x] Setup cron job cho sản phẩm mới
- [ ] Consider dedicated embedding service
- [ ] Consider queue system (Redis + Bull)

---

## 🔥 Rate Limit Reference

### Gemini API Free Tier:
- 15 requests/minute
- 1,500 requests/day
- **Max products/day:** ~1,500

### Gemini API Paid Tier:
- 60+ requests/minute (tier dependent)
- Unlimited daily requests
- **Max products/hour:** ~3,000+

**Tính toán:**
```
1000 products ÷ 3 concurrent ÷ 2 seconds per batch
= ~11 minutes (paid tier)
= ~45 minutes (free tier với delays)
```

---

## 💡 Best Practices

### 1. **Incremental Generation**
```bash
# Chỉ generate products thiếu embeddings
node scripts/generate_embeddings.js
# Script tự động detect products chưa có embedding
```

### 2. **Monitor Progress**
```bash
# Script hiển thị:
# ✅ [450/1000] (45.0%) Product Name... 
# ⏸️ Batch complete. ETA: ~8 min
```

### 3. **Error Recovery**
- Script có retry logic (2 attempts)
- Failed products được log ra
- Có thể chạy lại để generate failed items

### 4. **Performance Monitoring**
```bash
# Check embeddings coverage
SELECT 
  (SELECT COUNT(*) FROM product_embeddings) as cached,
  (SELECT COUNT(*) FROM product) as total,
  ROUND((SELECT COUNT(*) FROM product_embeddings) / (SELECT COUNT(*) FROM product) * 100, 2) as coverage_percent
FROM dual;
```

---

## 🚨 Troubleshooting

### "429 Too Many Requests"
```bash
# Tăng delay giữa batches
EMBEDDING_BATCH_DELAY=3000  # 3 seconds

# Giảm concurrent limit
EMBEDDING_CONCURRENT_LIMIT=2
```

### "Server startup quá lâu"
```bash
# Giảm batch size khi startup
EMBEDDING_STARTUP_BATCH=10  # hoặc 0 để disable
```

### "Script bị dừng giữa chừng"
```bash
# Chạy lại - chỉ generate products thiếu
node scripts/generate_embeddings.js
```

---

## 📞 Support

Gặp vấn đề với quy mô lớn?
1. Check Gemini API quota: https://aistudio.google.com/
2. Review error logs trong console
3. Adjust `.env` settings theo guide
4. Consider upgrading API tier

**Happy scaling! 🚀**
