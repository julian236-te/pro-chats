@echo off
title Pro Chats Mobile App
echo ========================================================
echo        تشغيل تطبيق برو شاتس (Pro Chats Mobile)
echo ========================================================
echo.

echo [1/2] جاري تشغيل خادم المحادثات الفورية (Backend Server)...
start "Pro Chats Server" cmd /k "cd server && node index.js"

timeout /t 2 /nobreak >nul

echo [2/2] جاري تشغيل واجهة التطبيق (Frontend Client)...
start "Pro Chats Client" cmd /k "cd client && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ========================================================
echo تم التشغيل بنجاح! افتح الرابط التالي في المتصفح:
echo http://localhost:3000
echo ========================================================
start http://localhost:3000
