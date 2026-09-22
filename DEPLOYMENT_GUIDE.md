# دليل رفع وتشغيل تطبيق Pro Chats على سيرفر سحابي 🚀📱☕️

تم تجهيز المشروع بالكامل ليعمل بنظام **Full-Stack متكامل في سيرفر واحد (Single-Service)**، بحيث يقوم خادم Node.js نفسه بخدمة واجهة React ومحادثات الـ WebSockets وقاعدة البيانات على نفس الرابط وبدون أي مشاكل في الـ CORS.

---

## 🌟 الطريقة الأولى (الموصى بها): الاستضافة المجانية الدائمة على Render.com

منصة **Render.com** توفر استضافة مجانية 24/7 تدعم تطبيقات الـ Node.js والـ WebSockets بدون الحاجة لإدخال أي بطاقة ائتمان.

### الخطوة 1: رفع المشروع إلى حسابك على GitHub
1. ادخل على حسابك في **[GitHub](https://github.com)** واضغط على **New repository**.
2. سمِّ المستودع مثلاً: `pro-chats` واجعله **Public** أو **Private** (كما تحب)، ثم اضغط **Create repository**.
3. افتح التيرمينال (PowerShell) داخل مجلد المشروع ونفّذ الأوامر التالية (استبدل `YOUR_USERNAME` باسم حسابك):
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/pro-chats.git
   git push -u origin main
   ```

### الخطوة 2: الربط والتشغيل على Render.com
1. ادخل على **[Render.com](https://render.com)** وسجل الدخول باستخدام حساب GitHub.
2. اضغط على زر **New +** في الأعلى، ثم اختر **Web Service**.
3. اختر مستودع `pro-chats` الذي قمت برفعه للتو ثم اضغط **Connect**.
4. سيقرأ Render ملف `render.yaml` تلقائياً، أو يمكنك التأكد من ملء الحقول التالية:
   - **Name**: `pro-chats`
   - **Language**: `Node`
   - **Region**: `Frankfurt` (أو الأقرب لك)
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. اضغط على **Deploy Web Service**.
6. سيبدأ البناء وفي دقيقة واحدة سيعطيك Render رابطاً عالمياً دائماً ومؤمناً (HTTPS) مثل:
   👉 **`https://pro-chats-xxxx.onrender.com`**

---

## 🚂 الطريقة الثانية: الاستضافة على Railway.app
إذا كنت تفضل **Railway**:
1. ادخل على **[Railway.app](https://railway.app)** وسجل دخول بحساب GitHub.
2. اضغط **New Project** ثم **Deploy from GitHub repo**.
3. اختر مستودع `pro-chats`.
4. سيتعرف Railway على الـ `Dockerfile` المجهز في المشروع وسيقوم ببناء وتشغيل الحاوية فوراً.
5. ادخل على تبويب **Settings** ثم **Networking** واضغط **Generate Domain** للحصول على رابط مباشر.

---

## 🐳 الطريقة الثالثة: التشغيل باستخدام Docker (لأي سيرفر VPS / Ubuntu)
إذا كان لديك سيرفر خاص (VPS على DigitalOcean أو Hetzner أو AWS):
1. انسخ ملفات المشروع على السيرفر.
2. ابنِ الحاوية وشغلها:
   ```bash
   docker build -t pro-chats .
   docker run -d -p 4000:4000 --name pro-chats --restart always pro-chats
   ```
3. سيعمل التطبيق مباشرة على بورت `4000` للسيرفر.

---

## ⚡️ الطريقة الرابعة: مشاركة رابط تجريبي فوري في ثانية واحدة (بدون رفع كود)
إذا أردت تجربة التطبيق مع صديقك الآن فوراً من جهازك بدون إنشاء حسابات:
1. افتح نافذة أوامر في المجلد واكتب:
   ```bash
   npx localtunnel --port 4000
   ```
2. سيظهر لك رابط خارجي آمن مثل: `https://cool-cats-dance.loca.lt`.
3. شاركه مع صديقك وافتحاه معاً وابدآ المحادثة في التو واللحظة!

---

## 📲 كيفية الاستخدام بعد الرفع:
1. افتح الرابط على هاتفك وسجل برقم هاتفك (مثلاً: `01111111111`).
2. افتح الرابط على هاتف صديقك وسجل برقم آخر (مثلاً: `01222222222`).
3. اضغط على أيقونة المحادثة الجديدة واكتب رقم صديقك، وابدآ في إرسال الرسائل والصوتيات ومكالمات الفيديو في الوقت الحقيقي!
