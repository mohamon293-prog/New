# 🚀 دليل النشر على Railway.app

## الطريقة سهلة جداً - 10 دقائق فقط!

---

## 📋 الخطوة 1: إنشاء قاعدة بيانات MongoDB مجانية

### 1.1 اذهب إلى MongoDB Atlas
🔗 https://www.mongodb.com/cloud/atlas/register

### 1.2 أنشئ حساب مجاني
- اضغط "Try Free"
- سجّل بـ Google أو بريدك

### 1.3 أنشئ Cluster مجاني
- اختر "M0 FREE"
- اختر أقرب منطقة (مثل: Frankfurt أو Bahrain)
- اضغط "Create"

### 1.4 أنشئ مستخدم للـ Database
- اذهب إلى "Database Access"
- اضغط "Add New Database User"
- Username: `gamelo`
- Password: `GameloPass123`
- اضغط "Add User"

### 1.5 اسمح بالوصول من أي IP
- اذهب إلى "Network Access"
- اضغط "Add IP Address"
- اضغط "Allow Access from Anywhere"
- اضغط "Confirm"

### 1.6 احصل على رابط الاتصال
- اذهب إلى "Database" > "Connect"
- اختر "Connect your application"
- انسخ الرابط (سيكون مثل):
```
mongodb+srv://gamelo:GameloPass123@cluster0.xxxxx.mongodb.net/gamelo_db?retryWrites=true&w=majority
```

---

## 📋 الخطوة 2: إنشاء حساب Railway

### 2.1 اذهب إلى Railway
🔗 https://railway.app

### 2.2 سجّل بـ GitHub
- اضغط "Login"
- اختر "Login with GitHub"
- وافق على الصلاحيات

---

## 📋 الخطوة 3: نشر Backend

### 3.1 أنشئ مشروع جديد
- اضغط "New Project"
- اختر "Deploy from GitHub repo"
- اختر `mohamon293-prog/New`

### 3.2 أضف متغيرات البيئة
بعد إنشاء المشروع:
- اضغط على المشروع
- اذهب إلى "Variables"
- اضغط "New Variable" وأضف:

```
MONGO_URL = mongodb+srv://gamelo:GameloPass123@cluster0.xxxxx.mongodb.net/gamelo_db?retryWrites=true&w=majority
DB_NAME = gamelo_db
JWT_SECRET = your_super_secret_key_change_this_123456789
JWT_ALGORITHM = HS256
JWT_EXPIRATION_HOURS = 24
FERNET_KEY = اتركه فارغ أو أضف مفتاح
PORT = 8080
```

### 3.3 إعداد أمر البدء
- اذهب إلى "Settings"
- في "Start Command" ضع:
```
cd backend && pip install -r requirements.txt && uvicorn server:app --host 0.0.0.0 --port $PORT
```

### 3.4 انتظر النشر
- Railway سينشر تلقائياً
- انتظر حتى يظهر ✅

### 3.5 احصل على الرابط
- اذهب إلى "Settings"
- اضغط "Generate Domain"
- ستحصل على رابط مثل: `your-app.up.railway.app`

---

## 📋 الخطوة 4: نشر Frontend

### 4.1 أنشئ مشروع جديد للـ Frontend
- اضغط "New Project"
- اختر "Deploy from GitHub repo"
- اختر نفس الـ repo

### 4.2 أضف متغيرات البيئة
```
REACT_APP_BACKEND_URL = https://your-backend.up.railway.app
```
(استبدل برابط الـ Backend من الخطوة 3.5)

### 4.3 إعداد أمر البناء
- في "Settings":
- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Start Command: `npx serve -s build -l $PORT`

### 4.4 احصل على رابط Frontend
- اضغط "Generate Domain"

---

## ✅ انتهى!

### روابطك:
- **الموقع**: https://your-frontend.up.railway.app
- **API**: https://your-backend.up.railway.app

### بيانات الدخول:
- **البريد**: admin@gamelo.com
- **كلمة المرور**: admin123

---

## 🔧 إذا واجهت مشكلة

### مشكلة: الموقع لا يفتح
- تأكد من أن `REACT_APP_BACKEND_URL` صحيح
- تأكد من أن MongoDB Atlas يسمح بالوصول من أي IP

### مشكلة: خطأ في API
- تحقق من `MONGO_URL` في Railway
- تأكد من أن الـ Backend يعمل (علامة ✅)

---

## 📞 تواصل معي إذا احتجت مساعدة!
