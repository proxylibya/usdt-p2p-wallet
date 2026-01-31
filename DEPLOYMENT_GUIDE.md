# 📱 Mobile Deployment Guide (Android & iOS)

This guide explains how to build and upload your USDT P2P Wallet app to the Google Play Store and Apple App Store.

---

## ✨ الحل الأمثل: GitHub Actions (بدون تثبيت أي برنامج!)

أفضل طريقة لبناء التطبيق **بدون تثبيت Android Studio أو Android SDK** هي استخدام **GitHub Actions** الذي يبني التطبيق تلقائياً في السحابة.

### 📋 الخطوات (سهلة جداً):

#### 1️⃣ رفع المشروع إلى GitHub
```powershell
# افتح Terminal في مجلد المشروع
cd C:\USDT-P2P-PROJECT

# إنشاء Git repository (إذا لم يكن موجود)
git init
git add .
git commit -m "Initial commit"

# ربط المشروع بـ GitHub (أنشئ Repo جديد على GitHub أولاً)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

#### 2️⃣ تفعيل GitHub Actions
- افتح مستودعك على GitHub
- اذهب إلى تبويب **Actions**
- سترى workflow اسمه **"Build Android APK"**
- سيبدأ البناء تلقائياً عند كل push

#### 3️⃣ تحميل التطبيق الجاهز
- بعد انتهاء البناء (حوالي 5-10 دقائق)
- اذهب إلى تبويب **Actions** → اختر آخر Build ناجح
- انزل إلى أسفل الصفحة → **Artifacts**
- حمّل ملف **`app-release`** (هذا هو تطبيق Android الجاهز!)

#### 4️⃣ تثبيت التطبيق على هاتفك
- انقل ملف `.apk` إلى هاتف Android
- افتح الملف وثبّته (قد تحتاج تفعيل "Install from unknown sources")

---

## 🤖 Android (Google Play Store)

### ✅ Status: Ready for Upload
I have already configured your project for **Signed Release Builds** without needing Android Studio.

### 1. Build the App Bundle (.aab)
The `.aab` (Android App Bundle) is the file you upload to the Play Store.

run this command in your terminal:
```powershell
cd apps/web/android
./gradlew bundleRelease
```

### 2. Locate the File
Once the build finishes, your file will be at:
`apps/web/android/app/build/outputs/bundle/release/app-release.aab`

### 3. Upload to Play Console
1.  Go to [Google Play Console](https://play.google.com/console).
2.  Create a new app.
3.  Go to **Production** (or **Testing** > **Internal testing** for a beta).
4.  Click **Create new release**.
5.  Upload the `app-release.aab` file.
6.  **Signing Key**: Google will ask about App Signing. Since we signed it locally with `my-release-key.keystore`, you can choose "Export and upload a key from Java keystore" if needed, or let Google manage it (recommended for new apps).

### 🔑 Important: Your Keystore
*   **File**: `apps/web/android/app/my-release-key.keystore`
*   **Password**: `password123`
*   **Alias**: `my-key-alias`
*   **⚠️ BACKUP THIS FILE!** If you lose it, you cannot update your app on the Play Store.

---

## 🍎 iOS (Apple App Store)

### ⚠️ Requirement: macOS
Apple **strictly requires a Mac computer** to build iOS apps. You cannot build a final `.ipa` file on Windows directly.

### Option 1: You have a Mac (or friend's Mac)
1.  Copy this entire project folder to the Mac.
2.  Run `npm install` and `npm run build` in `apps/web`.
3.  Run `npx cap sync ios`.
4.  Open `apps/web/ios/App/App.xcworkspace` in **Xcode**.
5.  Login with your Apple Developer Account in Xcode settings.
6.  Go to **Product > Archive**.
7.  Click **Distribute App** to upload to App Store Connect.

### Option 2: Cloud Build (No Mac required)
If you don't have a Mac, you can use a cloud CI/CD service like **Ionic Appflow** or **GitHub Actions (macOS runner)**.

**Using Ionic Appflow (Paid Service):**
1.  Create an account on [ionic.io](https://ionic.io).
2.  Link your GitHub repo.
3.  Set up an iOS build certificate (requires Apple Developer Account).
4.  Trigger a build in the cloud.
5.  Download the `.ipa` and upload it using "Transporter" (requires Windows with iTunes) or directly from the cloud if supported.

### Option 3: Rent a Mac in the Cloud
Use a service like **MacInCloud** or **MacStadium** to remote desktop into a Mac and follow Option 1.

---

## 🚀 Common Issues & Fixes

### "App not installed" (Android)
If you are testing the release APK on your phone, uninstall any "Debug" version of the app first. The signatures must match.

### "Invalid App ID" (iOS)
Make sure the `appId` in `capacitor.config.ts` (`com.usdtwallet.app`) matches exactly what you created in the Apple Developer Portal.

