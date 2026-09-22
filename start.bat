@echo off
chcp 65001 >nul
title Pro Chats - تشغيل التطبيق بنقرة واحدة

echo =======================================================
echo          ☕️ مرحباً بك في Pro Chats ☕️
echo =======================================================
echo.
echo [1/3] جاري فحص بيئة التشغيل Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [خطأ] لم يتم العثور على Node.js على جهازك!
    echo يرجى تحميل وتثبيت Node.js من: https://nodejs.org
    pause
    exit /b
)

echo [2/3] جاري تشغيل السيرفر والواجهة الأمامية...
start "Pro Chats - Server (Backend)" cmd /c "cd /d %~dp0server && node index.js"
start "Pro Chats - Client (Frontend)" cmd /c "cd /d %~dp0client && npm run dev"

echo [3/3] جاري فتح المتصفح على http://localhost:3000 ...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo =======================================================
echo  ✅ تم تشغيل Pro Chats بنجاح!
echo  السيرفر يعمل على: http://localhost:4000
echo  الواجهة تعمل على: http://localhost:3000
echo  لإيقاف التطبيق، يمكنك إغلاق نوافذ الأوامر المفتوحة.
echo =======================================================
echo.
pause
