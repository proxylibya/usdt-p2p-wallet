@echo off
echo ====================================
echo اصلاح قاعدة البيانات - UTF8
echo ====================================
cd /d "%~dp0"
npx ts-node scripts/recreate-db-utf8.ts
pause
