# 🚀 دليل النشر السحابي - USDT P2P Wallet

## 📋 نظرة عامة

هذا الدليل يوضح كيفية نشر المشروع على السحابة **بدون Docker** باستخدام:
- 🚂 **Railway** للـ Backend API + PostgreSQL
- ▲ **Vercel** للـ Frontend (Web + Admin)
- 📦 **GitHub** لإدارة الكود

---

## 🎯 الخطوات الكاملة

### **المرحلة 1️⃣: رفع الكود على GitHub**

#### إذا لم يكن مرفوعاً بعد:

```bash
# في مجلد المشروع
git init
git add .
git commit -m "Initial commit - USDT P2P Wallet"

# إنشاء Repository على GitHub ثم:
git remote add origin https://github.com/YOUR_USERNAME/usdt-p2p-wallet.git
git branch -M main
git push -u origin main
```

#### إذا كان مرفوعاً:

```bash
# تأكد من رفع آخر التعديلات
git add .
git commit -m "Add deployment configs"
git push
```

---

### **المرحلة 2️⃣: نشر Backend API على Railway**

#### **الخطوة 1: إنشاء مشروع Railway**

1. اذهب إلى: https://railway.app
2. سجل دخول بحساب GitHub
3. اضغط **New Project**
4. اختر **Deploy from GitHub repo**
5. اختر Repository الخاص بك

#### **الخطوة 2: إعداد PostgreSQL**

1. في مشروع Railway، اضغط **+ New**
2. اختر **Database** → **PostgreSQL**
3. انتظر حتى يتم إنشاء القاعدة

#### **الخطوة 3: إعداد Backend Service**

1. اضغط **+ New** → **GitHub Repo**
2. اختر مجلد `apps/api` كـ Root Directory:
   - اضغط **Settings**
   - في **Root Directory** اكتب: `apps/api`
   - **Save**

#### **الخطوة 4: إضافة Environment Variables**

في **Variables** للـ API Service، أضف:

```bash
# Application
NODE_ENV=production
PORT=3002
APP_URL=https://your-api.railway.app
API_PREFIX=api
API_VERSION=v1

# Database (سيتم ملؤها تلقائياً من PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT (غيّر القيمة!)
JWT_SECRET=your-super-secret-jwt-key-min-64-characters-change-this-in-production-abc123xyz789
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Auth
AUTH_DIRECT_LOGIN=false

# OTP
OTP_EXPIRATION_MINUTES=5
OTP_LENGTH=6

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=60

# CORS (سيتم تحديثه بعد نشر Frontend)
CORS_ORIGINS=https://your-web-app.vercel.app,https://your-admin.vercel.app

# Redis (اتركه false أو استخدم Railway Redis)
REDIS_ENABLED=false

# Storage
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./uploads

# External APIs
BINANCE_API_URL=https://api.binance.com/api/v3

# Gemini AI (اختياري)
GEMINI_API_KEY=

# SMS Provider (اختياري - للـ OTP الحقيقي)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Email (اختياري)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=
EMAIL_FROM=noreply@yourdomain.com

# Security
BCRYPT_ROUNDS=12
ENCRYPTION_KEY=your-32-character-encryption-key
```

#### **الخطوة 5: Deploy**

1. اضغط **Deploy**
2. انتظر حتى يكتمل البناء (5-10 دقائق)
3. احصل على الـ URL من **Settings** → **Domains**
4. مثال: `https://usdt-api-production.up.railway.app`

---

### **المرحلة 3️⃣: نشر Mobile App على Vercel**

#### **الخطوة 1: ربط Vercel بـ GitHub**

1. اذهب إلى: https://vercel.com
2. سجل دخول بحساب GitHub
3. اضغط **Add New** → **Project**
4. اختر Repository الخاص بك

#### **الخطوة 2: إعدادات Mobile App**

1. اختر Repository
2. في **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

#### **الخطوة 3: Environment Variables**

أضف:

```bash
VITE_API_URL=https://your-api.railway.app/api/v1
VITE_USE_REAL_API=true
```

(غيّر `your-api.railway.app` بالـ URL الحقيقي من Railway)

#### **الخطوة 4: Deploy**

1. اضغط **Deploy**
2. انتظر 2-3 دقائق
3. احصل على الـ URL، مثال: `https://usdt-wallet.vercel.app`

---

### **المرحلة 4️⃣: نشر Admin Dashboard على Vercel**

كرر نفس الخطوات للـ Mobile App لكن:

- **Root Directory**: `apps/admin`
- **Environment Variables**:
  ```bash
  VITE_API_URL=https://your-api.railway.app/api/v1
  ```

احصل على URL مثل: `https://usdt-admin.vercel.app`

---

### **المرحلة 5️⃣: تحديث CORS في Backend**

1. ارجع لـ Railway → API Service → **Variables**
2. حدّث `CORS_ORIGINS`:

```bash
CORS_ORIGINS=https://usdt-wallet.vercel.app,https://usdt-admin.vercel.app,capacitor://localhost
```

3. اضغط **Redeploy**

---

## ✅ **التحقق من النشر**

### **اختبار Backend:**
```bash
curl https://your-api.railway.app/api/v1
```
يجب أن يرجع: `{"status":"ok","version":"1.0.0"}`

### **اختبار Frontend:**
1. افتح `https://usdt-wallet.vercel.app`
2. سجل حساب جديد أو سجل دخول
3. جرب الميزات

### **اختبار Admin:**
1. افتح `https://usdt-admin.vercel.app`
2. سجل دخول بـ:
   - Email: `admin@usdt-p2p.local`
   - Password: `000000`

---

## 🔧 **إعداد Seed Data في Production**

بعد نشر Backend، شغّل Seed مرة واحدة:

```bash
# في جهازك المحلي، اتصل بقاعدة Production
# احصل على DATABASE_URL من Railway

DATABASE_URL="postgresql://user:pass@host:port/db" npm run prisma:seed -w apps/api
```

**أو** استخدم Railway CLI:

```bash
railway link
railway run npm run prisma:seed -w apps/api
```

---

## 📊 **ملخص URLs النهائية**

| التطبيق | URL المتوقع |
|---------|-------------|
| Backend API | `https://usdt-api.railway.app` |
| Swagger Docs | `https://usdt-api.railway.app/docs` |
| Mobile App | `https://usdt-wallet.vercel.app` |
| Admin Dashboard | `https://usdt-admin.vercel.app` |
| PostgreSQL | (داخلي في Railway) |

---

## 🎯 **نصائح مهمة**

### **1. Domains المخصصة (اختياري)**
- في Vercel: اضغط **Domains** → أضف Domain الخاص بك
- في Railway: **Settings** → **Custom Domains**

### **2. استخدام Neon بدلاً من Railway PostgreSQL**

إذا تريد استخدام Neon.tech:

1. أنشئ مشروع في https://neon.tech
2. احصل على `DATABASE_URL`
3. استخدمها في Railway Environment Variables بدلاً من `${{Postgres.DATABASE_URL}}`

### **3. تحديثات مستقبلية**

عند تحديث الكود:
```bash
git add .
git commit -m "Update feature X"
git push
```

Vercel و Railway سيُحدّثون تلقائياً! ✨

---

## 🚨 **استكشاف الأخطاء**

### **Backend لا يعمل:**
- تحقق من Logs في Railway
- تأكد من `DATABASE_URL` صحيح
- تأكد من Migrations تطبقت

### **Frontend لا يتصل بـ Backend:**
- تأكد من `VITE_API_URL` صحيح
- تأكد من CORS محدث في Backend
- افتح Console في المتصفح للأخطاء

### **OTP لا يُرسل:**
- في Dev Mode: OTP يظهر في Console
- في Production: تحتاج Twilio/Vonage credentials

---

## ✅ **انتهيت!**

المشروع الآن **منشور بالكامل** على السحابة! 🎉

- لا حاجة لـ Docker ❌
- تحديثات تلقائية من GitHub ✅
- قواعد بيانات مُدارة ✅
- SSL مجاني ✅

**استمتع بمشروعك! 🚀**
