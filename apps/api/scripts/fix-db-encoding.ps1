# ============================================
# إصلاح ترميز قاعدة البيانات لدعم النصوص العربية
# ============================================

Write-Host "🔧 إصلاح ترميز قاعدة البيانات..." -ForegroundColor Cyan

# التحقق من وجود PostgreSQL
$pgPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $pgPath) {
    Write-Host "❌ PostgreSQL غير مثبت أو غير موجود في PATH" -ForegroundColor Red
    Write-Host "الرجاء تثبيت PostgreSQL أو إضافته إلى PATH" -ForegroundColor Yellow
    exit 1
}

# حفظ مسار السكريبت الحالي
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# إعادة إنشاء قاعدة البيانات
Write-Host "📊 إعادة إنشاء قاعدة البيانات بترميز UTF8..." -ForegroundColor Yellow
$env:PGPASSWORD = "postgres123"
psql -U postgres -f "$scriptPath\recreate_db_utf8.sql" postgres

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ فشل في إعادة إنشاء قاعدة البيانات" -ForegroundColor Red
    exit 1
}

Write-Host "✅ تم إعادة إنشاء قاعدة البيانات بنجاح" -ForegroundColor Green

# الانتقال إلى مجلد API
Set-Location "$scriptPath\.."

# تطبيق migrations
Write-Host "🔄 تطبيق migrations..." -ForegroundColor Yellow
npx prisma migrate deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  فشل في تطبيق migrations، محاولة إعادة التطبيق..." -ForegroundColor Yellow
    npx prisma db push --accept-data-loss
}

Write-Host "✅ تم إصلاح قاعدة البيانات بنجاح!" -ForegroundColor Green
Write-Host "يمكنك الآن إنشاء حساب أدمن بنص عربي" -ForegroundColor Cyan
