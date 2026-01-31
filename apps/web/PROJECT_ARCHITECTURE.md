# 🏗️ USDT Wallet - بنية المشروع الكاملة

> آخر تحديث: 2026-01-23

---

## 📋 نظرة عامة

| العنصر | القيمة |
|--------|--------|
| **اسم المشروع** | USDT Wallet |
| **نوع التطبيق** | Mobile App (iOS + Android) + Web |
| **البنية** | Clean Architecture (Microservices-Ready) |
| **القدرة** | 100,000+ مستخدم متزامن |

---

## 🎯 المنصات المستهدفة

| المنصة | التقنية | الحالة |
|--------|---------|--------|
| Android | Capacitor → APK/AAB | ✅ جاهز |
| iOS | Capacitor → IPA | ✅ جاهز |
| Web | React → Browser | ✅ جاهز |

---

## 📱 Frontend Stack

```
├── React 19
├── TypeScript
├── Vite (Build Tool)
├── TailwindCSS (Styling)
├── Capacitor (Mobile Wrapper)
├── Lucide Icons
└── React Router DOM
```

### Capacitor Plugins:
- @capacitor/app
- @capacitor/haptics
- @capacitor/keyboard
- @capacitor/status-bar
- @capacitor/splash-screen
- @capacitor/camera
- @capacitor/push-notifications
- @capacitor/browser
- @capacitor/clipboard
- @capacitor/share

---

## 🖥️ Backend Stack

```
├── NestJS (Framework)
├── TypeScript
├── PostgreSQL (Main Database)
├── Redis (Cache + Sessions)
├── Prisma (ORM)
├── JWT + Refresh Tokens (Auth)
├── Bull Queue (Background Jobs)
└── WebSocket (Real-time)
```

---

## 🏛️ البنية المعمارية: Clean Architecture

### المبادئ:
1. **Separation of Concerns** - فصل المسؤوليات
2. **Dependency Inversion** - عكس التبعيات
3. **Single Responsibility** - مسؤولية واحدة
4. **Domain-Driven Design** - تصميم موجه بالمجال

### الطبقات:

```
┌─────────────────────────────────────────────┐
│              🌐 Presentation                │
│         (Controllers, DTOs, Guards)         │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│              📦 Application                 │
│            (Use Cases, Services)            │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│               🧠 Domain                     │
│      (Entities, Interfaces, Rules)          │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│            🔧 Infrastructure                │
│    (Database, Cache, External APIs)         │
└─────────────────────────────────────────────┘
```

---

## 📊 System Architecture (Production)

```
🌐 المستخدمون (مئات الآلاف)
         │
         ▼
┌─────────────────────────────────────────────┐
│           🔀 Load Balancer (Nginx)          │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│           🚪 API Gateway (NestJS)           │
│   • Rate Limiting                           │
│   • Authentication                          │
│   • Request Validation                      │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│              📦 Services Layer              │
│  ┌─────────┐ ┌─────────┐ ┌─────────────┐   │
│  │  Auth   │ │ Wallet  │ │     P2P     │   │
│  │ Service │ │ Service │ │   Service   │   │
│  └─────────┘ └─────────┘ └─────────────┘   │
│  ┌─────────┐ ┌─────────┐ ┌─────────────┐   │
│  │ Market  │ │  User   │ │Notification │   │
│  │ Service │ │ Service │ │   Service   │   │
│  └─────────┘ └─────────┘ └─────────────┘   │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│              💾 Data Layer                  │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ PostgreSQL   │  │    Redis     │        │
│  │ (Main DB)    │  │   (Cache)    │        │
│  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────┘
```

---

## 📁 هيكل المشروع الكامل

```
📦 usdt-wallet/                    # Frontend (React + Capacitor)
│
├── 📂 components/                 # UI Components
├── 📂 pages/                      # App Screens
├── 📂 context/                    # React Context Providers
├── 📂 hooks/                      # Custom Hooks
├── 📂 services/                   # API Services
├── 📂 constants/                  # App Constants
├── 📂 types/                      # TypeScript Types
├── 📂 src/                        # Styles
├── 📂 android/                    # Android Native
├── 📂 ios/                        # iOS Native
└── 📄 capacitor.config.ts


📦 usdt-wallet-backend/            # Backend (NestJS)
│
├── 📂 src/
│   ├── 📂 core/                   # Business Logic
│   │   ├── 📂 domain/             # Entities
│   │   ├── 📂 use-cases/          # Use Cases
│   │   └── 📂 interfaces/         # Contracts
│   │
│   ├── 📂 infrastructure/         # Technical Implementation
│   │   ├── 📂 database/           # Prisma + PostgreSQL
│   │   ├── 📂 cache/              # Redis
│   │   ├── 📂 queue/              # Bull Queue
│   │   └── 📂 external/           # External APIs
│   │
│   ├── 📂 api/                    # API Layer
│   │   ├── 📂 controllers/
│   │   ├── 📂 middlewares/
│   │   ├── 📂 guards/
│   │   └── 📂 dto/
│   │
│   └── 📂 shared/                 # Shared Utilities
│
├── 📂 prisma/                     # Database Schema
├── 📂 test/                       # Tests
├── 📄 docker-compose.yml
└── 📄 Dockerfile
```

---

## 🔐 الأمان (Security)

| الميزة | التقنية |
|--------|---------|
| Authentication | JWT + Refresh Tokens |
| Password Hashing | bcrypt (salt rounds: 12) |
| Rate Limiting | 1000 req/min/user |
| CORS | Configured for allowed origins |
| Helmet | Security headers |
| Input Validation | class-validator |
| SQL Injection | Prisma (parameterized queries) |
| XSS Protection | Sanitization + CSP |

---

## ⚡ الأداء (Performance)

| التقنية | الوظيفة |
|---------|---------|
| Redis Cache | تخزين البيانات المتكررة |
| Connection Pooling | إعادة استخدام اتصالات DB |
| Database Indexing | فهرسة الحقول المهمة |
| Lazy Loading | تحميل الصفحات عند الحاجة |
| Code Splitting | تقسيم الكود |
| Gzip Compression | ضغط الاستجابات |

---

## 📦 Services (الخدمات)

### 1. Auth Service
- Login (Phone + OTP)
- Register
- Social Login (Google, Apple)
- Biometric Authentication
- Password Reset
- Session Management

### 2. User Service
- Profile Management
- KYC Verification
- Preferences
- Address Book

### 3. Wallet Service
- Balance Management
- Deposit
- Withdraw
- Internal Transfer
- Transaction History

### 4. P2P Service
- Create/Manage Offers
- Trade Room
- Escrow System
- Dispute Resolution

### 5. Market Service
- Live Prices (Binance API)
- Price Alerts
- Market Data

### 6. Notification Service
- Push Notifications
- Email
- SMS
- In-App Notifications

---

## 🗄️ Database Schema (Core Tables)

```sql
-- Users
users (id, phone, email, name, avatar_url, kyc_status, created_at)

-- Wallets
wallets (id, user_id, asset, network, balance, locked_balance)

-- Transactions
transactions (id, user_id, type, asset, amount, status, tx_hash, created_at)

-- P2P Offers
p2p_offers (id, user_id, type, asset, fiat, price, min, max, status)

-- P2P Trades
p2p_trades (id, offer_id, buyer_id, seller_id, amount, status, created_at)

-- Sessions
sessions (id, user_id, refresh_token, device, ip, expires_at)
```

---

## 🐳 Docker Setup

```yaml
# docker-compose.yml
services:
  api:
    build: .
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: usdt_wallet
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secure_password

  redis:
    image: redis:7-alpine
```

---

## 🚀 أوامر التشغيل

### Frontend:
```bash
cd usdt-wallet
npm run dev          # Development
npm run build        # Production Build
npx cap sync         # Sync to Mobile
npx cap open android # Open Android Studio
npx cap open ios     # Open Xcode
```

### Backend:
```bash
cd usdt-wallet-backend
npm run start:dev    # Development
npm run build        # Build
npm run start:prod   # Production
npx prisma migrate   # Run Migrations
npx prisma studio    # Database GUI
```

---

## 📋 خطة التنفيذ

### المرحلة 1: تجهيز Frontend ✅
- [x] إعداد Capacitor
- [x] تثبيت Native Plugins
- [x] إصلاح Path Aliases
- [x] Build Success
- [ ] تنظيف البيانات الوهمية
- [ ] إنشاء API Service Layer

### المرحلة 2: بناء Backend
- [ ] إنشاء مشروع NestJS
- [ ] إعداد PostgreSQL + Prisma
- [ ] إعداد Redis
- [ ] بناء Auth Module
- [ ] بناء User Module
- [ ] بناء Wallet Module
- [ ] بناء P2P Module
- [ ] بناء Market Module
- [ ] بناء Notification Module

### المرحلة 3: التكامل
- [ ] ربط Frontend بـ Backend
- [ ] اختبار الـ APIs
- [ ] Real-time (WebSocket)

### المرحلة 4: الإنتاج
- [ ] Docker Setup
- [ ] CI/CD Pipeline
- [ ] Cloud Deployment
- [ ] Monitoring & Logging

---

## ⚠️ شروط المشروع الصارمة (STRICT REQUIREMENTS)

### قواعد البيانات:
| القرار | السبب |
|--------|-------|
| ✅ **PostgreSQL فقط** | قاعدة بيانات رسمية وقوية للإنتاج |
| ❌ **ممنوع SQLite** | ضعيفة وغير مناسبة للإنتاج |
| ✅ **Redis** | للـ Cache والـ Sessions |

### التقنيات المطلوبة (Production-Grade):
- **Backend:** NestJS + TypeScript
- **Database:** PostgreSQL 16 + Prisma ORM
- **Cache:** Redis 7
- **Auth:** JWT + Passport
- **API Docs:** Swagger/OpenAPI

### قواعد صارمة:
1. ❌ **لا Mock Data** في الإنتاج
2. ❌ **لا تغيير في التصميم** الجميل
3. ✅ **الربط حقيقي نهائي** مع قاعدة بيانات حقيقية
4. ✅ **API endpoints حقيقية** فقط

---

## 📝 ملاحظات مهمة

1. **التصميم محفوظ 100%** - لا تغيير في واجهة المستخدم
2. **Mobile-First** - التطبيق مصمم للموبايل أساساً
3. **RTL Support** - دعم كامل للعربية
4. **Scalable** - قابل للتوسع لملايين المستخدمين

---

> 📌 هذا الملف هو المرجع الرئيسي لبنية المشروع. يجب تحديثه عند أي تغيير جوهري.
