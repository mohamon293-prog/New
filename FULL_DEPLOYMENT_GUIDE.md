# 🎮 دليل نشر Gamelo على Hostinger VPS - الدليل الشامل

## 📋 المتطلبات الأساسية

### نوع الاستضافة المطلوب
| النوع | السعر | مناسب؟ |
|-------|-------|--------|
| Shared Hosting | $2/شهر | ❌ لا يعمل |
| **VPS KVM 1** | $5/شهر | ✅ مناسب |
| **VPS KVM 2** | $10/شهر | ✅ الأفضل |

### مواصفات VPS KVM 1
- RAM: 4GB
- CPU: 2 vCPU
- Storage: 50GB NVMe
- نظام التشغيل: **Ubuntu 22.04 LTS**

---

# 🔰 الطريقة الأولى: التثبيت التلقائي (الأسهل)

## الخطوة 1: شراء VPS من Hostinger

1. اذهب إلى: https://www.hostinger.com/vps-hosting
2. اختر **KVM 1** أو أعلى
3. اختر نظام التشغيل: **Ubuntu 22.04 64bit**
4. أكمل الشراء

## الخطوة 2: الحصول على بيانات السيرفر

بعد الشراء، من لوحة تحكم Hostinger:
1. اذهب إلى **VPS** > اختر السيرفر
2. ستجد:
   - **IP Address**: مثل `123.456.789.10`
   - **Username**: `root`
   - **Password**: كلمة المرور

## الخطوة 3: توجيه الدومين

### إذا الدومين على Hostinger:
1. اذهب إلى **Domains** > اختر الدومين
2. اذهب إلى **DNS / Nameservers**
3. أضف **A Record**:
   - Name: `@`
   - Points to: `IP السيرفر`
4. أضف **A Record** ثاني:
   - Name: `www`
   - Points to: `IP السيرفر`

### إذا الدومين على Namecheap أو GoDaddy:
نفس الخطوات في لوحة تحكم DNS

⏰ **انتظر 5-30 دقيقة** حتى ينتشر DNS

## الخطوة 4: الاتصال بالسيرفر

### من Windows:
1. حمّل **PuTTY**: https://putty.org
2. افتح PuTTY
3. Host Name: `IP السيرفر`
4. Port: `22`
5. اضغط **Open**
6. أدخل: `root`
7. أدخل: `كلمة المرور`

### من Mac/Linux:
```bash
ssh root@IP_السيرفر
```

## الخطوة 5: تشغيل سكريبت التثبيت

انسخ والصق هذا الأمر:

```bash
wget -O install.sh https://raw.githubusercontent.com/mohamon293-prog/New/main/install.sh && chmod +x install.sh && ./install.sh
```

السكريبت سيسألك عن:
- **الدومين**: مثل `gamelo.com` (بدون https://)
- **بريدك الإلكتروني**: للحصول على SSL مجاني

⏰ **انتظر 10-15 دقيقة** حتى يكتمل التثبيت

## الخطوة 6: تم!

بعد انتهاء السكريبت:
- **الموقع**: `https://دومينك.com`
- **البريد**: `admin@gamelo.com`
- **كلمة المرور**: `admin123`

---

# 🔧 الطريقة الثانية: التثبيت اليدوي (خطوة بخطوة)

## الخطوة 1: تحديث النظام

```bash
apt update && apt upgrade -y
```

## الخطوة 2: تثبيت الأدوات الأساسية

```bash
apt install -y curl wget git build-essential software-properties-common ufw nano
```

## الخطوة 3: تثبيت Python 3.11

```bash
add-apt-repository ppa:deadsnakes/ppa -y
apt update
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip
```

تحقق من التثبيت:
```bash
python3.11 --version
```

## الخطوة 4: تثبيت Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

تحقق من التثبيت:
```bash
node --version
npm --version
```

## الخطوة 5: تثبيت MongoDB 7

```bash
# إضافة مفتاح MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# إضافة المستودع
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# تثبيت MongoDB
apt update
apt install -y mongodb-org

# تشغيل MongoDB
systemctl start mongod
systemctl enable mongod
```

تحقق من التثبيت:
```bash
systemctl status mongod
```

## الخطوة 6: تثبيت Nginx

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

## الخطوة 7: تثبيت Supervisor

```bash
apt install -y supervisor
systemctl start supervisor
systemctl enable supervisor
```

## الخطوة 8: تثبيت Certbot (SSL)

```bash
apt install -y certbot python3-certbot-nginx
```

## الخطوة 9: تحميل المشروع

```bash
# إنشاء المجلد
mkdir -p /var/www/gamelo
cd /var/www/gamelo

# تحميل من GitHub
git clone https://github.com/mohamon293-prog/New.git .
```

## الخطوة 10: إعداد Backend

```bash
cd /var/www/gamelo/backend

# إنشاء البيئة الافتراضية
python3.11 -m venv venv

# تفعيل البيئة
source venv/bin/activate

# تثبيت المكتبات
pip install --upgrade pip
pip install -r requirements.txt
```

### إنشاء ملف .env للـ Backend

```bash
nano .env
```

انسخ والصق:
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=gamelo_db
JWT_SECRET=اكتب_كلمة_سرية_طويلة_هنا_مثل_abc123xyz789
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
FERNET_KEY=
```

لتوليد FERNET_KEY:
```bash
source venv/bin/activate
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

انسخ الناتج وضعه في FERNET_KEY

اضغط `Ctrl+X` ثم `Y` ثم `Enter` للحفظ

### إنشاء مجلدات الرفع

```bash
mkdir -p uploads/products uploads/banners uploads/categories
chmod -R 755 uploads
```

## الخطوة 11: إعداد Frontend

```bash
cd /var/www/gamelo/frontend

# إنشاء ملف .env
nano .env
```

انسخ والصق (استبدل الدومين):
```
REACT_APP_BACKEND_URL=https://الدومين_الخاص_بك
```

اضغط `Ctrl+X` ثم `Y` ثم `Enter` للحفظ

```bash
# تثبيت المكتبات
npm install

# بناء التطبيق
npm run build
```

⏰ **انتظر 2-5 دقائق** للبناء

## الخطوة 12: إعداد Supervisor

```bash
# إنشاء مجلد اللوجات
mkdir -p /var/log/gamelo

# إنشاء ملف الإعدادات
nano /etc/supervisor/conf.d/gamelo.conf
```

انسخ والصق:
```ini
[program:gamelo-backend]
command=/var/www/gamelo/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
directory=/var/www/gamelo/backend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/gamelo/backend.err.log
stdout_logfile=/var/log/gamelo/backend.out.log
environment=PATH="/var/www/gamelo/backend/venv/bin"
```

اضغط `Ctrl+X` ثم `Y` ثم `Enter` للحفظ

```bash
# تعيين الصلاحيات
chown -R www-data:www-data /var/www/gamelo
chown -R www-data:www-data /var/log/gamelo

# تحديث Supervisor
supervisorctl reread
supervisorctl update
supervisorctl start gamelo-backend
```

تحقق من العمل:
```bash
supervisorctl status gamelo-backend
```

يجب أن يظهر: `RUNNING`

## الخطوة 13: إعداد Nginx

```bash
nano /etc/nginx/sites-available/gamelo
```

انسخ والصق (استبدل YOUR_DOMAIN بدومينك):
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN www.YOUR_DOMAIN;
    
    root /var/www/gamelo/frontend/build;
    index index.html;
    
    client_max_body_size 50M;
    
    # API Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

اضغط `Ctrl+X` ثم `Y` ثم `Enter` للحفظ

```bash
# تفعيل الموقع
ln -sf /etc/nginx/sites-available/gamelo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# اختبار الإعدادات
nginx -t

# إعادة تشغيل Nginx
systemctl restart nginx
```

## الخطوة 14: إعداد SSL (HTTPS)

```bash
certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN
```

- أدخل بريدك الإلكتروني
- اكتب `Y` للموافقة
- اختر `2` للتحويل التلقائي من HTTP إلى HTTPS

## الخطوة 15: إعداد Firewall

```bash
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable
```

## الخطوة 16: إنشاء حساب المسؤول

```bash
cd /var/www/gamelo/backend
source venv/bin/activate

python3 << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
from datetime import datetime, timezone

async def create_admin():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.gamelo_db
    now = datetime.now(timezone.utc).isoformat()
    
    # تحقق من وجود المسؤول
    existing = await db.users.find_one({"email": "admin@gamelo.com"})
    if existing:
        print("⚠️ المسؤول موجود مسبقاً")
        return
    
    # إنشاء المسؤول
    password_hash = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode()
    
    admin_doc = {
        "id": str(uuid.uuid4()),
        "email": "admin@gamelo.com",
        "password_hash": password_hash,
        "name": "مدير النظام",
        "phone": "",
        "role": "admin",
        "role_level": 100,
        "permissions": [],
        "is_active": True,
        "is_approved": True,
        "wallet_balance": 0.0,
        "wallet_balance_jod": 0.0,
        "wallet_balance_usd": 0.0,
        "created_at": now,
        "updated_at": now
    }
    
    await db.users.insert_one(admin_doc)
    print("✅ تم إنشاء حساب المسؤول")
    print("📧 البريد: admin@gamelo.com")
    print("🔑 كلمة المرور: admin123")

asyncio.run(create_admin())
EOF
```

## الخطوة 17: إنشاء الأقسام

```bash
python3 << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

async def create_categories():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.gamelo_db
    now = datetime.now(timezone.utc).isoformat()
    
    categories = [
        {"id": "playstation", "name": "بلايستيشن", "name_en": "PlayStation", "slug": "playstation", "order": 1},
        {"id": "xbox", "name": "إكس بوكس", "name_en": "Xbox", "slug": "xbox", "order": 2},
        {"id": "steam", "name": "ستيم", "name_en": "Steam", "slug": "steam", "order": 3},
        {"id": "nintendo", "name": "نينتندو", "name_en": "Nintendo", "slug": "nintendo", "order": 4},
        {"id": "mobile", "name": "ألعاب الجوال", "name_en": "Mobile Games", "slug": "mobile", "order": 5},
        {"id": "other", "name": "أخرى", "name_en": "Other", "slug": "other", "order": 6},
    ]
    
    for cat in categories:
        existing = await db.categories.find_one({"id": cat["id"]})
        if not existing:
            cat["is_active"] = True
            cat["created_at"] = now
            cat["updated_at"] = now
            await db.categories.insert_one(cat)
            print(f"✅ تم إنشاء: {cat['name']}")

asyncio.run(create_categories())
EOF
```

## ✅ تم التثبيت!

- **الموقع**: https://دومينك.com
- **البريد**: admin@gamelo.com
- **كلمة المرور**: admin123

---

# 🐳 الطريقة الثالثة: باستخدام Docker (للمتقدمين)

## الخطوة 1: تثبيت Docker

```bash
# تثبيت Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# تثبيت Docker Compose
apt install -y docker-compose-plugin
```

## الخطوة 2: تحميل المشروع

```bash
mkdir -p /var/www/gamelo
cd /var/www/gamelo
git clone https://github.com/mohamon293-prog/New.git .
```

## الخطوة 3: إنشاء docker-compose.yml

```bash
nano docker-compose.yml
```

انسخ والصق:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: gamelo-mongo
    restart: always
    volumes:
      - mongo_data:/data/db
    networks:
      - gamelo-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: gamelo-backend
    restart: always
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=gamelo_db
      - JWT_SECRET=your_secret_key_here
      - JWT_ALGORITHM=HS256
      - JWT_EXPIRATION_HOURS=24
    depends_on:
      - mongodb
    networks:
      - gamelo-network
    ports:
      - "8001:8001"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: gamelo-frontend
    restart: always
    environment:
      - REACT_APP_BACKEND_URL=https://YOUR_DOMAIN
    depends_on:
      - backend
    networks:
      - gamelo-network
    ports:
      - "3000:3000"

  nginx:
    image: nginx:alpine
    container_name: gamelo-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - frontend
      - backend
    networks:
      - gamelo-network

volumes:
  mongo_data:

networks:
  gamelo-network:
    driver: bridge
```

## الخطوة 4: إنشاء Dockerfile للـ Backend

```bash
nano backend/Dockerfile
```

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p uploads/products uploads/banners uploads/categories

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

## الخطوة 5: إنشاء Dockerfile للـ Frontend

```bash
nano frontend/Dockerfile
```

```dockerfile
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/build ./build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
```

## الخطوة 6: تشغيل Docker

```bash
docker compose up -d
```

---

# 📋 أوامر مفيدة

## إعادة تشغيل الخدمات

```bash
# Backend
supervisorctl restart gamelo-backend

# Nginx
systemctl restart nginx

# MongoDB
systemctl restart mongod
```

## عرض اللوجات

```bash
# لوجات Backend
tail -f /var/log/gamelo/backend.err.log

# لوجات Nginx
tail -f /var/log/nginx/error.log
```

## تحديث الكود

```bash
cd /var/www/gamelo
git pull origin main

# تحديث Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
supervisorctl restart gamelo-backend

# تحديث Frontend
cd ../frontend
npm install
npm run build
```

## نسخ احتياطي لقاعدة البيانات

```bash
# نسخ احتياطي
mongodump --db gamelo_db --out /backup/$(date +%Y%m%d)

# استعادة
mongorestore --db gamelo_db /backup/20250105/gamelo_db
```

---

# 🔧 حل المشاكل الشائعة

## مشكلة: الموقع لا يفتح

```bash
# تحقق من Nginx
nginx -t
systemctl status nginx

# تحقق من Backend
supervisorctl status gamelo-backend
curl http://localhost:8001/api/health
```

## مشكلة: خطأ 502 Bad Gateway

```bash
# تحقق من Backend
supervisorctl restart gamelo-backend
tail -f /var/log/gamelo/backend.err.log
```

## مشكلة: خطأ في قاعدة البيانات

```bash
# تحقق من MongoDB
systemctl status mongod
systemctl restart mongod
```

## مشكلة: SSL لا يعمل

```bash
# تجديد SSL
certbot renew

# أو إعادة الحصول عليه
certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN
```

## مشكلة: الصور لا تظهر

```bash
chown -R www-data:www-data /var/www/gamelo/backend/uploads
chmod -R 755 /var/www/gamelo/backend/uploads
```

---

# 🔐 الأمان

## تغيير كلمة مرور المسؤول

1. ادخل للوحة التحكم
2. اذهب لإعدادات الحساب
3. غيّر كلمة المرور

## تغيير JWT_SECRET

```bash
nano /var/www/gamelo/backend/.env
# غيّر JWT_SECRET لقيمة جديدة
supervisorctl restart gamelo-backend
```

---

# 📞 الدعم

إذا واجهت أي مشكلة:
1. تحقق من اللوجات
2. أرسل لي الخطأ الذي يظهر
3. سأساعدك في حله

---

**🎮 Gamelo - منصة الألعاب الرقمية**
