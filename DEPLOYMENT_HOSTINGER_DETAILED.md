# 🎮 دليل رفع موقع Gamelo على Hostinger
## شرح مبسط خطوة بخطوة للمبتدئين

---

## 📌 قبل البدء - ماذا تحتاج؟

### 1. حساب Hostinger مع VPS
- اذهب إلى [hostinger.com](https://hostinger.com)
- اختر خطة **VPS Hosting** (ليس Shared Hosting)
- **الخطة الموصى بها**: KVM 2 أو أعلى
  - 💾 RAM: 4GB
  - 💻 CPU: 2 cores
  - 📀 Storage: 50GB SSD
  - 💵 السعر: حوالي $10-15/شهر

### 2. دومين (اسم النطاق)
- مثال: `gamelo.com` أو `gamelo.store`
- يمكنك شراؤه من Hostinger أو GoDaddy أو Namecheap

---

## 🚀 الخطوات التفصيلية

---

### 📍 المرحلة 1: إعداد VPS على Hostinger

#### الخطوة 1.1: شراء VPS
1. سجل دخول لحسابك في Hostinger
2. اذهب إلى **VPS** → **Buy VPS**
3. اختر خطة **KVM 2** أو أعلى
4. اختر موقع السيرفر (أوروبا أو أمريكا)
5. أكمل الدفع

#### الخطوة 1.2: إعداد VPS
1. من لوحة تحكم Hostinger، اذهب إلى **VPS** → **Manage**
2. اختر نظام التشغيل: **Ubuntu 22.04 LTS**
3. سيُعطيك:
   - **IP Address**: مثل `185.199.110.153`
   - **Root Password**: كلمة مرور root
4. **احفظ هذه المعلومات!**

#### الخطوة 1.3: ربط الدومين
1. من لوحة Hostinger، اذهب إلى **Domains**
2. اختر دومينك → **DNS Zone**
3. أضف/عدّل سجل **A Record**:
   ```
   Type: A
   Name: @
   Points to: [IP الخادم]
   TTL: 3600
   ```
4. أضف سجل آخر لـ www:
   ```
   Type: A
   Name: www
   Points to: [IP الخادم]
   TTL: 3600
   ```
5. انتظر 5-30 دقيقة للتفعيل

---

### 📍 المرحلة 2: الاتصال بالخادم

#### الخطوة 2.1: تحميل برنامج SSH
- **Windows**: حمّل [PuTTY](https://putty.org) أو استخدم PowerShell
- **Mac/Linux**: Terminal موجود افتراضياً

#### الخطوة 2.2: الاتصال
```bash
ssh root@IP_الخادم
```
مثال:
```bash
ssh root@185.199.110.153
```
- أدخل كلمة المرور عند طلبها
- اكتب `yes` إذا سألك عن fingerprint

#### الخطوة 2.3: تحديث النظام
```bash
apt update && apt upgrade -y
```
انتظر 2-5 دقائق...

---

### 📍 المرحلة 3: تثبيت البرامج المطلوبة

#### الخطوة 3.1: تثبيت الأدوات الأساسية
```bash
apt install -y curl wget git nano ufw
```

#### الخطوة 3.2: تثبيت Python
```bash
apt install -y python3 python3-pip python3-venv
```

#### الخطوة 3.3: تثبيت Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

#### الخطوة 3.4: تثبيت MongoDB
```bash
# إضافة مفتاح MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

# إضافة المستودع
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# التثبيت
apt update
apt install -y mongodb-org

# تشغيل MongoDB
systemctl start mongod
systemctl enable mongod

# التحقق
systemctl status mongod
```
يجب أن ترى: `active (running)` ✅

#### الخطوة 3.5: تثبيت Nginx
```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

---

### 📍 المرحلة 4: رفع ملفات المشروع

#### الخطوة 4.1: إنشاء المجلد
```bash
mkdir -p /var/www/gamelo
cd /var/www/gamelo
```

#### الخطوة 4.2: رفع الملفات

**الطريقة الأسهل - من Emergent مباشرة:**

1. في Emergent، اضغط **"Save to GitHub"** لحفظ المشروع
2. على الخادم:
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .
```

**أو بالطريقة اليدوية (FileZilla):**

1. حمّل [FileZilla](https://filezilla-project.org)
2. اتصل بالخادم:
   - Host: `sftp://IP_الخادم`
   - Username: `root`
   - Password: كلمة المرور
   - Port: `22`
3. انقل مجلدي `backend` و `frontend` إلى `/var/www/gamelo/`

---

### 📍 المرحلة 5: إعداد Backend

```bash
cd /var/www/gamelo/backend

# إنشاء البيئة الافتراضية
python3 -m venv venv
source venv/bin/activate

# تثبيت المكتبات
pip install --upgrade pip
pip install -r requirements.txt
```

#### إنشاء ملف الإعدادات:
```bash
nano .env
```

الصق هذا المحتوى (غيّر القيم):
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=gamelo_production
JWT_SECRET=اكتب_نص_عشوائي_طويل_جداً_هنا_123456789
ENCRYPTION_KEY=اكتب_نص_عشوائي_آخر_للتشفير_987654321
CORS_ORIGINS=https://yourdomain.com
```

للحفظ: `Ctrl+X` → `Y` → `Enter`

#### إنشاء مفتاح التشفير الصحيح:
```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```
انسخ الناتج وضعه في `ENCRYPTION_KEY`

---

### 📍 المرحلة 6: إعداد Frontend

```bash
cd /var/www/gamelo/frontend

# إنشاء ملف الإعدادات
nano .env
```

الصق (غيّر الدومين):
```
REACT_APP_BACKEND_URL=https://yourdomain.com
```

للحفظ: `Ctrl+X` → `Y` → `Enter`

```bash
# تثبيت المكتبات
npm install

# بناء الموقع (مهم جداً!)
npm run build
```
انتظر 2-5 دقائق... سيُنشئ مجلد `build`

---

### 📍 المرحلة 7: إعداد Nginx

```bash
nano /etc/nginx/sites-available/gamelo
```

الصق (غيّر `yourdomain.com`):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend - الواجهة
    location / {
        root /var/www/gamelo/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # الملفات المرفوعة
    location /uploads {
        alias /var/www/gamelo/uploads;
    }

    # حجم الملفات المسموح
    client_max_body_size 50M;
}
```

للحفظ: `Ctrl+X` → `Y` → `Enter`

```bash
# تفعيل الموقع
ln -sf /etc/nginx/sites-available/gamelo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# اختبار الإعدادات
nginx -t

# إعادة تشغيل Nginx
systemctl restart nginx
```

---

### 📍 المرحلة 8: شهادة SSL (HTTPS مجاني)

```bash
# تثبيت Certbot
apt install -y certbot python3-certbot-nginx

# الحصول على الشهادة (غيّر الدومين)
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

- أدخل بريدك الإلكتروني
- اكتب `Y` للموافقة
- اختر `2` لإعادة التوجيه التلقائي لـ HTTPS

---

### 📍 المرحلة 9: تشغيل Backend كخدمة

```bash
nano /etc/systemd/system/gamelo.service
```

الصق:
```ini
[Unit]
Description=Gamelo Backend
After=network.target mongod.service

[Service]
User=root
WorkingDirectory=/var/www/gamelo/backend
Environment="PATH=/var/www/gamelo/backend/venv/bin"
ExecStart=/var/www/gamelo/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

للحفظ: `Ctrl+X` → `Y` → `Enter`

```bash
# تفعيل وتشغيل
systemctl daemon-reload
systemctl enable gamelo
systemctl start gamelo

# التحقق
systemctl status gamelo
```
يجب أن ترى: `active (running)` ✅

---

### 📍 المرحلة 10: إنشاء حساب المدير

```bash
cd /var/www/gamelo/backend
source venv/bin/activate

python3 << 'SCRIPT'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

load_dotenv()

async def create_admin():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    # غيّر هذه البيانات!
    admin_email = "admin@yourdomain.com"
    admin_password = "كلمة_مرور_قوية_123!"
    admin_name = "مدير النظام"
    
    existing = await db.users.find_one({"email": admin_email})
    if existing:
        print(f"⚠️ الحساب موجود مسبقاً: {admin_email}")
        return
    
    password_hash = bcrypt.hashpw(admin_password.encode(), bcrypt.gensalt()).decode()
    
    await db.users.insert_one({
        "id": str(uuid.uuid4()),
        "email": admin_email,
        "password_hash": password_hash,
        "name": admin_name,
        "role": "admin",
        "is_active": True,
        "is_approved": True,
        "wallet_balance_jod": 0.0,
        "wallet_balance_usd": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    print(f"✅ تم إنشاء حساب المدير!")
    print(f"📧 البريد: {admin_email}")
    print(f"🔑 كلمة المرور: {admin_password}")

asyncio.run(create_admin())
SCRIPT
```

---

### 📍 المرحلة 11: إعداد الجدار الناري

```bash
ufw allow 22      # SSH
ufw allow 80      # HTTP
ufw allow 443     # HTTPS
ufw --force enable
```

---

## ✅ اختبار الموقع

1. افتح المتصفح واذهب إلى `https://yourdomain.com`
2. يجب أن ترى الصفحة الرئيسية
3. جرب تسجيل الدخول بحساب المدير
4. اذهب إلى `/admin` للوحة التحكم

---

## 🔄 تحديث الموقع مستقبلاً

```bash
cd /var/www/gamelo

# جلب التحديثات من GitHub
git pull

# تحديث Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
systemctl restart gamelo

# تحديث Frontend
cd ../frontend
npm install
npm run build

# إعادة تحميل Nginx
nginx -s reload
```

---

## 🆘 حل المشاكل الشائعة

### المشكلة: الموقع لا يفتح
```bash
# تحقق من Nginx
systemctl status nginx
tail -f /var/log/nginx/error.log

# تحقق من Backend
systemctl status gamelo
journalctl -u gamelo -f
```

### المشكلة: خطأ 502 Bad Gateway
```bash
# Backend لا يعمل، أعد تشغيله
systemctl restart gamelo
```

### المشكلة: خطأ في قاعدة البيانات
```bash
# تحقق من MongoDB
systemctl status mongod
systemctl restart mongod
```

---

## 📊 النسخ الاحتياطي

```bash
# نسخ قاعدة البيانات يومياً
mongodump --db gamelo_production --out /backup/$(date +%Y%m%d)

# نسخ الملفات المرفوعة
cp -r /var/www/gamelo/uploads /backup/uploads_$(date +%Y%m%d)
```

---

## 💡 نصائح مهمة

1. **غيّر كلمة مرور root** بعد أول تسجيل دخول
2. **احفظ مفاتيح JWT و ENCRYPTION** في مكان آمن
3. **فعّل النسخ الاحتياطي التلقائي** من لوحة Hostinger
4. **راقب استخدام الموارد** من لوحة التحكم

---

## 📞 تحتاج مساعدة؟

- **Hostinger Support**: دعم 24/7 من لوحة التحكم
- **الأخطاء**: راجع ملفات الـ logs أعلاه

---

**آخر تحديث**: يناير 2025
