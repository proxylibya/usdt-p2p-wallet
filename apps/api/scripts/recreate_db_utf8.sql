-- ============================================
-- إعادة إنشاء قاعدة البيانات بترميز UTF8 الصحيح
-- ============================================

-- إنهاء جميع الاتصالات النشطة
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'usdt_wallet'
  AND pid <> pg_backend_pid();

-- حذف قاعدة البيانات القديمة
DROP DATABASE IF EXISTS usdt_wallet;

-- إنشاء قاعدة بيانات جديدة مع ترميز UTF8
CREATE DATABASE usdt_wallet
  WITH 
  OWNER = postgres
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8'
  TEMPLATE = template0;
