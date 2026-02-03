# 🚀 دليل نشر Frontend على Vercel

**التاريخ:** 3 فبراير 2026

---

## 📌 ما هو Vercel؟

**Vercel** هو منصة نشر سحابية متخصصة في تطبيقات Frontend وتطبيقات Full-stack.

### ✨ مميزات Vercel:

| الميزة | الوصف |
|-------|-------|
| 🚀 **سريع جداً** | CDN عالمي - تحميل فوري من أقرب سيرفر |
| 🔄 **Deploy تلقائي** | كل push على GitHub = deploy جديد |
| 🆓 **مجاني** | خطة مجانية ممتازة للمشاريع الشخصية |
| 🎯 **مخصص لـ React** | دعم ممتاز لـ React, Next.js, Vite |
| 🔒 **HTTPS تلقائي** | SSL مجاني ومُجدد تلقائياً |
| 📊 **Analytics** | إحصائيات الأداء والزوار |

---

## 🎯 الخطة: نشر Frontend

### المشروع الحالي:
- **Framework:** React 19 + Vite
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **Mobile:** Capacitor (Android/iOS)
- **Location:** `apps/web/`

---

## 📋 الخطوات التفصيلية

### الخطوة 1️⃣: إنشاء حساب Vercel

1. اذهب إلى: https://vercel.com
2. اضغط **Sign Up**
3. اختر **Continue with GitHub**
4. أدخل بيانات GitHub الخاصة بك
5. وافق على صلاحيات Vercel

✅ **النتيجة:** حساب Vercel مربوط بـ GitHub

---

### الخطوة 2️⃣: ربط Repository

1. في Vercel Dashboard، اضغط **Add New Project**
2. اختر **Import Git Repository**
3. ابحث عن: `proxylibya/usdt-p2p-wallet`
4. اضغط **Import**

---

### الخطوة 3️⃣: إعدادات المشروع (Project Settings)

في صفحة Configure Project، أدخل الإعدادات التالية:

#### 📁 Framework Preset
```
Framework: Vite
```

#### 📂 Root Directory
```
Root Directory: apps/web
```
⚠️ **مهم جداً:** يجب تحديد `apps/web` لأنه Monorepo

#### 🏗️ Build & Output Settings

| Setting | Value |
|---------|-------|
| **Build Command** | `npm run build` أو `vite build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

---

### الخطوة 4️⃣: Environment Variables

أضف المتغيرات التالية في **Environment Variables**:

```bash
# API Backend URL (من Railway)
VITE_API_URL=https://your-api.railway.app/api/v1

# تفعيل Real API
VITE_USE_REAL_API=true
```

⚠️ **مهم:** استبدل `your-api.railway.app` بـ URL الحقيقي من Railway

---

### الخطوة 5️⃣: Deploy!

1. اضغط **Deploy**
2. انتظر 2-3 دقائق حتى ينتهي البناء
3. سيعطيك Vercel رابط مثل: `https://your-project.vercel.app`

---

## 🔧 الإعدادات الإضافية

### 1. Custom Domain (اختياري)

بعد النشر، يمكنك ربط دومين خاص:
1. اذهب إلى **Settings** → **Domains**
2. أضف Domain الخاص بك
3. اتبع تعليمات DNS

---

### 2. Vercel.json (موجود بالفعل ✅)

الملف موجود في: `apps/web/vercel.json`

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

هذا يضمن أن React Router يعمل بشكل صحيح.

---

### 3. إعدادات Build الحالية

من `vite.config.ts`:
- ✅ Build Target: `esnext`
- ✅ Code Splitting: مفعّل
- ✅ Minification: مفعّل
- ✅ Console.log removal في production

---

## ⚠️ نقاط مهمة قبل Deploy

### 1. تحديث API URL

**قبل Deploy:**
```env
VITE_API_URL=http://localhost:3002/api/v1
```

**بعد Deploy:**
```env
VITE_API_URL=https://usdt-p2p-wallet-production.up.railway.app/api/v1
```

---

### 2. CORS في Backend

تأكد أن Backend يسمح بطلبات من Vercel domain:

في `apps/api/src/main.ts`:
```typescript
app.enableCors({
  origin: [
    'http://localhost:3000',
    'https://your-project.vercel.app',  // أضف هذا
    'https://*.vercel.app'              // أو هذا لكل subdomains
  ],
  credentials: true,
});
```

---

### 3. فحص محلي قبل Deploy

```bash
# في apps/web/
npm run build
npm run preview

# افتح http://localhost:3000
# تأكد أن كل شيء يعمل
```

---

## 🐛 حل المشاكل الشائعة

### مشكلة 1: Build Failed
```
Error: Cannot find module '@/components/...'
```

**الحل:**
- تأكد أن Root Directory = `apps/web`
- تأكد من `vite.config.ts` aliases

---

### مشكلة 2: API Requests Failed (CORS)
```
Access to fetch blocked by CORS policy
```

**الحل:**
1. أضف Vercel URL إلى CORS في Backend
2. أعد deploy Backend على Railway
3. أعد deploy Frontend على Vercel

---

### مشكلة 3: 404 on Refresh
```
Page not found when refreshing route
```

**الحل:**
- تأكد من وجود `vercel.json` ✅ (موجود)
- تأكد من rewrites configuration

---

### مشكلة 4: Environment Variables لا تعمل
```
VITE_API_URL is undefined
```

**الحل:**
- تأكد أن المتغيرات تبدأ بـ `VITE_`
- أعد deploy بعد إضافة المتغيرات
- **مهم:** تحتاج redeploy بعد تغيير env vars

---

## 📊 بعد Deploy - التحقق

### ✅ Checklist:

- [ ] الموقع يفتح: `https://your-project.vercel.app`
- [ ] الصفحة الرئيسية تظهر بشكل صحيح
- [ ] Routing يعمل (جرب صفحات مختلفة)
- [ ] API Requests تعمل (Login, Register, etc.)
- [ ] Styling صحيح (TailwindCSS)
- [ ] Images تظهر
- [ ] لا توجد أخطاء في Console

---

## 🔄 التحديثات المستقبلية

**بعد أول Deploy ناجح:**

1. **كل تعديل في GitHub:**
   - Push على branch `main`
   - Vercel يبني ويرفع تلقائياً ✨

2. **Preview Deployments:**
   - كل Pull Request = preview deployment
   - يمكن اختبار التغييرات قبل merge

3. **Rollback:**
   - يمكن الرجوع لأي version سابق
   - من Vercel Dashboard → Deployments

---

## 📱 Capacitor (Mobile)

⚠️ **ملاحظة:** Vercel للـ Web فقط!

**لـ Mobile Apps:**
- Android: Google Play Console
- iOS: Apple App Store
- يجب build منفصل لكل platform

---

## 💰 التكلفة

### خطة Hobby (مجانية):
- ✅ Bandwidth: 100 GB/month
- ✅ Builds: Unlimited
- ✅ Deployments: Unlimited
- ✅ Projects: Unlimited
- ✅ Team Members: 1
- ✅ SSL: مجاني

**كافي لمعظم المشاريع الشخصية!**

---

## 🎯 الخلاصة

### الترتيب النهائي:

1. ✅ **Backend**: Railway (جاهز)
2. 🚀 **Frontend Web**: Vercel (التالي)
3. 📱 **Mobile Apps**: Play Store / App Store (لاحقاً)
4. ⚙️ **Admin Panel**: Vercel (بعد Web)

---

## 📝 Quick Command Reference

```bash
# Local Build Test
cd apps/web
npm run build
npm run preview

# Push to Deploy
git add .
git commit -m "deploy: frontend updates"
git push origin main
# Vercel يرفع تلقائياً! ✨
```

---

## 🔗 روابط مفيدة

- **Vercel Docs:** https://vercel.com/docs
- **Vite Docs:** https://vitejs.dev
- **Vercel Dashboard:** https://vercel.com/dashboard

---

**💡 نصيحة أخيرة:**
بعد أول deploy ناجح، راجع **Vercel Analytics** لمراقبة الأداء والزوار!
