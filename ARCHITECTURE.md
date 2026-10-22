# 🏗️ Kiến Trúc Deploy trên Render.com

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         RENDER.COM (FREE)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────┐       ┌─────────────────────────┐  │
│  │   Frontend (Static)    │       │   Backend (Docker)      │  │
│  │                        │       │                         │  │
│  │  - React App           │──────▶│  - Node.js + Express    │  │
│  │  - Nginx Server        │ API   │  - AI Chatbot (Gemini)  │  │
│  │  - Build: npm run build│ Calls │  - JWT Auth             │  │
│  │  - Port: 443 (HTTPS)   │       │  - Port: 10000          │  │
│  │                        │       │  - Health: /health      │  │
│  └────────────────────────┘       └─────────────────────────┘  │
│           │                                    │                │
│           │                                    │                │
│           ▼                                    ▼                │
│  my-store-frontend.onrender.com  my-store-backend.onrender.com │
│                                                                  │
└──────────────────────────────────────────────┬──────────────────┘
                                               │
                                               │ DB Connection
                                               │ (PostgreSQL pooled URL)
                                               │
                                               ▼
                    ┌──────────────────────────────────────┐
                    │   Neon PostgreSQL (Pooled)          │
                    │                                       │
                    │   Options:                            │
                    │   1. Neon pooled endpoint        │
                    │   2. pg.Pool in backend              │
                    │   3. TLS via DATABASE_URL              │
                    │                                       │
                    │   - Tables: product, account, orders, etc    │
                    │   - AI: embeddings, conversations     │
                    │   - Pooler: PgBouncer                        │
                    └──────────────────────────────────────┘
```

---

## 🔄 Deploy Flow

```
┌──────────────┐
│   Developer  │
└──────┬───────┘
       │
       │ 1. Code changes
       │
       ▼
┌──────────────┐
│   GitHub     │ ◄──── git push
│  Repository  │
└──────┬───────┘
       │
       │ 2. Webhook trigger
       │
       ▼
┌──────────────────────────────────┐
│         Render.com               │
│                                  │
│  ┌────────────────────────────┐ │
│  │  1. Detect render.yaml     │ │
│  │  2. Read configuration     │ │
│  │  3. Load env variables     │ │
│  └────────┬───────────────────┘ │
│           │                      │
│           ▼                      │
│  ┌────────────────────────────┐ │
│  │   Build Process            │ │
│  │                            │ │
│  │   Backend:                 │ │
│  │   - docker build           │ │
│  │   - npm install            │ │
│  │   - Copy files             │ │
│  │                            │ │
│  │   Frontend:                │ │
│  │   - npm install            │ │
│  │   - npm run build          │ │
│  │   - Static files ready     │ │
│  └────────┬───────────────────┘ │
│           │                      │
│           ▼                      │
│  ┌────────────────────────────┐ │
│  │   Deploy Process           │ │
│  │                            │ │
│  │   - Start containers       │ │
│  │   - Health checks          │ │
│  │   - SSL certificate        │ │
│  │   - Route traffic          │ │
│  └────────┬───────────────────┘ │
│           │                      │
│           ▼                      │
│        ✅ LIVE!                  │
└──────────────────────────────────┘
```

---

## 🌐 Request Flow

```
┌──────────┐
│  User    │
│  Browser │
└────┬─────┘
     │
     │ HTTPS Request
     │ https://my-store-frontend.onrender.com
     │
     ▼
┌────────────────────────────────────┐
│   Render CDN + Load Balancer       │
│   - SSL Termination                │
│   - DDoS Protection                │
│   - Global CDN                     │
└────┬───────────────────────────────┘
     │
     ▼
┌────────────────────────────────────┐
│   Frontend (Nginx)                 │
│                                    │
│   Static Files:                    │
│   - index.html                     │
│   - JavaScript bundles             │
│   - CSS, Images                    │
│   - React Router (SPA)             │
└────┬───────────────────────────────┘
     │
     │ API Call (AJAX)
     │ fetch('https://my-store-backend.onrender.com/api/...')
     │
     ▼
┌────────────────────────────────────┐
│   Backend API (Node.js)            │
│                                    │
│   Routes:                          │
│   - /api/products                  │
│   - /api/auth/login                │
│   - /api/ai/chat                   │
│   - /api/orders                    │
│   - /health ◄── Health Check       │
│   - /swagger ◄── API Docs          │
└────┬───────────────────────────────┘
     │
     │ Database Query
     │ SELECT * FROM SanPham...
     │
     ▼
┌────────────────────────────────────┐
│   Neon PostgreSQL                   │
│   (Neon pooled connection)     │
│                                    │
│   Tables:                          │
│   - product (Products)             │
│   - account (Accounts)            │
│   - orders (Orders)               │
│   - embeddings (AI)                │
│   - conversations (AI)             │
└────────────────────────────────────┘
```

---

## 🔐 Security Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ 1. Login Request
     │    POST /api/auth/login
     │    { email, password }
     │
     ▼
┌─────────────────────────────────────┐
│   Backend                           │
│                                     │
│   1. Validate credentials           │
│   2. Compare bcrypt hash            │
│   3. Generate JWT token             │
│      ├─ User ID                     │
│      ├─ Role                        │
│      ├─ Expiry                      │
│      └─ Sign with JWT_SECRET        │
└────┬────────────────────────────────┘
     │
     │ 2. Response
     │    Set-Cookie: coolshop_session (HttpOnly, Secure)
     │
     ▼
┌──────────┐
│  Client  │ Keeps only the profile in memory; JWT stays in HttpOnly cookie
└────┬─────┘
     │
     │ 3. Authenticated Request
     │    GET /api/orders
     │    Cookie sent automatically; writes also include X-CSRF-Token
     │
     ▼
┌─────────────────────────────────────┐
│   Backend Middleware                │
│                                     │
│   1. Extract JWT from HttpOnly cookie│
│   2. Verify JWT signature           │
│   3. Check expiry                   │
│   4. Decode user info               │
│   5. Attach to req.user             │
└────┬────────────────────────────────┘
     │
     │ 4. Process Request
     │    Access protected route
     │
     ▼
┌─────────────────────────────────────┐
│   Protected Route Handler           │
│   - req.user.id available           │
│   - req.user.role available         │
│   - Query user's data only          │
└─────────────────────────────────────┘
```

---

## 🤖 AI Chat Flow

```
┌──────────┐
│  User    │ Types: "Tìm áo MU size M"
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────┐
│   Frontend Chat Component           │
│   - Collect message                 │
│   - Show loading state              │
└────┬────────────────────────────────┘
     │
     │ POST /api/ai/chat
     │ { message, conversationId }
     │
     ▼
┌─────────────────────────────────────┐
│   Backend AI Controller             │
│                                     │
│   1. Load conversation history      │
│      from memory.js                 │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│   embeddings.js                     │
│                                     │
│   2. Convert query to embedding     │
│      using Gemini API               │
│      "Tìm áo MU size M"             │
│         ↓                           │
│      [0.23, -0.45, 0.78, ...]       │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│   Database (embeddings table)       │
│                                     │
│   3. Vector similarity search       │
│      - Compare with cached vectors  │
│      - Find top 5 similar products  │
│      - Return product IDs           │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│   Database (SanPham table)          │
│                                     │
│   4. Fetch full product details     │
│      - Name, price, images          │
│      - Stock, description           │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│   prompts.js                        │
│                                     │
│   5. Build context for Gemini       │
│      - System instructions          │
│      - Product data                 │
│      - User query                   │
│      - Conversation history         │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│   Gemini API (Google)               │
│                                     │
│   6. Generate response              │
│      - Natural language answer      │
│      - Product recommendations      │
│      - Helpful suggestions          │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│   Backend Response                  │
│                                     │
│   7. Format response                │
│      {                              │
│        reply: "...",                │
│        products: [...],             │
│        suggestions: [...]           │
│      }                              │
└────┬────────────────────────────────┘
     │
     ▼
┌──────────┐
│  User    │ Sees: "Tìm thấy 3 áo MU..."
└──────────┘
```

---

## 📦 Docker Build Process

```
Backend:
────────
Dockerfile
   ↓
FROM node:18-alpine
   ↓
WORKDIR /app
   ↓
COPY package*.json
   ↓
RUN npm install --production
   ↓
COPY . .
   ↓
EXPOSE 3006
   ↓
HEALTHCHECK /health
   ↓
CMD ["npm", "start"]
   ↓
Image: my-store-backend:latest
   ↓
Push to Render Registry
   ↓
Deploy as Container


Frontend:
─────────
Dockerfile (Multi-stage)

Stage 1: Build
   ↓
FROM node:18-alpine as build
   ↓
WORKDIR /app
   ↓
COPY package*.json
   ↓
RUN npm install
   ↓
COPY . .
   ↓
RUN npm run build
   ↓
Build output: /app/build/

Stage 2: Production
   ↓
FROM nginx:alpine
   ↓
COPY --from=build /app/build /usr/share/nginx/html
   ↓
COPY nginx.conf /etc/nginx/conf.d/
   ↓
EXPOSE 80
   ↓
CMD ["nginx", "-g", "daemon off;"]
   ↓
Image: my-store-frontend:latest
   ↓
Deploy to Render CDN
```

---

## 🔄 Auto Deploy Workflow

```
Developer makes changes
         │
         ▼
   git add .
   git commit -m "..."
   git push origin main
         │
         │ GitHub Webhook
         │
         ▼
┌────────────────────────┐
│   Render.com           │
│                        │
│   1. Receive webhook   │
│   2. Clone repo        │
│   3. Checkout main     │
│   4. Read render.yaml  │
└───────┬────────────────┘
        │
        ├─────────────────────────┬──────────────────────┐
        ▼                         ▼                      ▼
  Backend Build            Frontend Build        Env Vars
  ─────────────            ──────────────        ─────────
  docker build             npm run build         Load from
  npm install              Optimize assets       Dashboard
  Run tests (optional)     Generate static       Secrets safe
        │                         │                      │
        ▼                         ▼                      ▼
  Health Check             Copy to CDN          Inject to
  /health returns 200      Nginx config         containers
        │                         │                      │
        └─────────────────────────┴──────────────────────┘
                                  │
                                  ▼
                         Deploy Complete!
                                  │
                        ┌─────────┴─────────┐
                        ▼                   ▼
                  Backend LIVE        Frontend LIVE
             (Rolling update)     (Zero downtime)
```

---

## 💾 Data Flow

```
User Action → Frontend → Backend → Database → Backend → Frontend → User

Example: View Product
─────────────────────

1. User clicks product
         │
         ▼
2. Frontend: GET /api/products/123
         │
         ▼
3. Backend: Receive request
         │
         ▼
4. Database: SELECT * FROM SanPham WHERE MaSanPham=123
         │
         ▼
5. Database: Return product data
         │
         ▼
6. Backend: Format JSON response
         │
         ▼
7. Frontend: Receive data
         │
         ▼
8. Frontend: Render component
         │
         ▼
9. User sees product details
```

---

## 🌍 Global Architecture

```
                    INTERNET
                       │
         ┌─────────────┼─────────────┐
         │                           │
    Asia Users                  US/EU Users
         │                           │
         └─────────────┬─────────────┘
                       │
                       ▼
            ┌──────────────────┐
            │  Render Global   │
            │  Load Balancer   │
            └────────┬─────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
   Singapore DC            US East DC
   (Closest to VN)         (Render Default)
         │                       │
         │   Auto Route Based    │
         │   on User Location    │
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
              Your Application
         ┌──────────┴──────────┐
         │                     │
    Frontend CDN          Backend API
    (Global)              (Region)
```

---

**Kiến trúc này đảm bảo:**
- ✅ High Availability
- ✅ Auto Scaling
- ✅ Zero Downtime Deployment
- ✅ Global CDN
- ✅ SSL/TLS Encryption
- ✅ DDoS Protection
- ✅ Hoàn toàn MIỄN PHÍ
