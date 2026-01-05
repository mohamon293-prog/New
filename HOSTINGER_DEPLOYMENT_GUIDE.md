# 🚀 دليل نشر Gamelo على Hostinger VPS

## 📋 المتطلبات

### نوع الاستضافة المطلوب
- **Hostinger VPS** (ليس Shared Hosting)
- **الحد الأدنى**: VPS KVM 1 (2GB RAM, 1 vCPU)
- **الموصى به**: VPS KVM 2 (4GB RAM, 2 vCPU)
- **نظام التشغيل**: Ubuntu 22.04 LTS

> ⚠️ **مهم**: الاستضافة المشتركة (Shared Hosting) لا تدعم تطبيقات Python/FastAPI

---

## 🔧 الخطوة 1: الاتصال بالسيرفر

```bash
ssh root@YOUR_SERVER_IP
```

---

## 🔧 الخطوة 2: تحديث النظام

```bash
apt update && apt upgrade -y
```

---

## 🔧 الخطوة 3: تثبيت المتطلبات الأساسية

```bash
# تثبيت الأدوات الأساسية
apt install -y curl wget git build-essential software-properties-common

# تثبيت Python 3.11
add-apt-repository ppa:deadsnakes/ppa -y
apt update
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# تثبيت Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# تثبيت Nginx
apt install -y nginx

# تثبيت Certbot للـ SSL
apt install -y certbot python3-certbot-nginx
```

---

## 🔧 الخطوة 4: تثبيت MongoDB

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

# التحقق من العمل
systemctl status mongod
```

---

## 🔧 الخطوة 5: إنشاء مجلد المشروع

```bash
# إنشاء المجلد
mkdir -p /var/www/gamelo
cd /var/www/gamelo

# استنساخ المشروع من GitHub
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# أو رفع الملفات يدوياً عبر SFTP
```

---

## 🔧 الخطوة 6: إعداد Backend

```bash
cd /var/www/gamelo/backend

# إنشاء بيئة افتراضية
python3.11 -m venv venv
source venv/bin/activate

# تثبيت المكتبات
pip install --upgrade pip
pip install -r requirements.txt

# إنشاء ملف البيئة
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=gamelo_db
JWT_SECRET=YOUR_SUPER_SECRET_KEY_CHANGE_THIS_TO_RANDOM_STRING
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
FERNET_KEY=YOUR_FERNET_KEY_GENERATE_NEW_ONE
EOF

# توليد مفتاح Fernet جديد
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# انسخ الناتج وضعه في FERNET_KEY

# توليد JWT Secret
python3 -c "import secrets; print(secrets.token_hex(32))"
# انسخ الناتج وضعه في JWT_SECRET

# إنشاء مجلد الرفع
mkdir -p uploads/products uploads/banners uploads/categories

# تعيين الصلاحيات
chmod -R 755 uploads
```

---

## 🔧 الخطوة 7: إعداد Frontend

```bash
cd /var/www/gamelo/frontend

# تثبيت المكتبات
npm install

# إنشاء ملف البيئة
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=https://YOUR_DOMAIN.com
EOF

# بناء التطبيق للإنتاج
npm run build
```

---

## 🔧 الخطوة 8: إعداد Supervisor

```bash
# تثبيت Supervisor
apt install -y supervisor

# إنشاء ملف إعدادات Gamelo
cat > /etc/supervisor/conf.d/gamelo.conf << 'EOF'
[program:gamelo-backend]
command=/var/www/gamelo/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
directory=/var/www/gamelo/backend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/gamelo/backend.err.log
stdout_logfile=/var/log/gamelo/backend.out.log
environment=PATH="/var/www/gamelo/backend/venv/bin"
EOF

# إنشاء مجلد اللوجات
mkdir -p /var/log/gamelo
chown -R www-data:www-data /var/log/gamelo

# تعيين صلاحيات المجلد
chown -R www-data:www-data /var/www/gamelo

# تحديث Supervisor
supervisorctl reread
supervisorctl update
supervisorctl start gamelo-backend

# التحقق من العمل
supervisorctl status
```

---

## 🔧 الخطوة 9: إعداد Nginx

```bash
# إنشاء ملف إعدادات Nginx
cat > /etc/nginx/sites-available/gamelo << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN.com www.YOUR_DOMAIN.com;
    
    # Frontend - React Build
    root /var/www/gamelo/frontend/build;
    index index.html;
    
    # تعطيل حد حجم الرفع
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
    
    # Frontend Routes (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
EOF

# تفعيل الموقع
ln -sf /etc/nginx/sites-available/gamelo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# اختبار الإعدادات
nginx -t

# إعادة تشغيل Nginx
systemctl restart nginx
```

---

## 🔧 الخطوة 10: إعداد SSL (HTTPS)

```bash
# الحصول على شهادة SSL مجانية
certbot --nginx -d YOUR_DOMAIN.com -d www.YOUR_DOMAIN.com

# سيسألك عن بريدك الإلكتروني وموافقتك على الشروط
# اختر "2" لتحويل HTTP إلى HTTPS تلقائياً

# التحقق من التجديد التلقائي
certbot renew --dry-run
```

---

## 🔧 الخطوة 11: إنشاء حساب المسؤول

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
    
    # تحقق من وجود المسؤول
    existing = await db.users.find_one({"email": "admin@gamelo.com"})
    if existing:
        print("المسؤول موجود مسبقاً!")
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
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(admin_doc)
    print("✅ تم إنشاء حساب المسؤول بنجاح!")
    print("البريد: admin@gamelo.com")
    print("كلمة المرور: admin123")

asyncio.run(create_admin())
EOF
```

---

## 🔧 الخطوة 12: إنشاء الأقسام الأساسية

```bash
python3 << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime, timezone

async def create_categories():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.gamelo_db
    
    categories = [
        {"id": "playstation", "name": "بلايستيشن", "name_en": "PlayStation", "slug": "playstation", "order": 1},
        {"id": "xbox", "name": "إكس بوكس", "name_en": "Xbox", "slug": "xbox", "order": 2},
        {"id": "steam", "name": "ستيم", "name_en": "Steam", "slug": "steam", "order": 3},
        {"id": "nintendo", "name": "نينتندو", "name_en": "Nintendo", "slug": "nintendo", "order": 4},
        {"id": "mobile", "name": "ألعاب الجوال", "name_en": "Mobile Games", "slug": "mobile", "order": 5},
        {"id": "other", "name": "أخرى", "name_en": "Other", "slug": "other", "order": 6},
    ]
    
    now = datetime.now(timezone.utc).isoformat()
    
    for cat in categories:
        existing = await db.categories.find_one({"id": cat["id"]})
        if not existing:
            cat["is_active"] = True
            cat["created_at"] = now
            cat["updated_at"] = now
            await db.categories.insert_one(cat)
            print(f"✅ تم إنشاء قسم: {cat['name']}")
        else:
            print(f"⏭️ القسم موجود: {cat['name']}")

asyncio.run(create_categories())
EOF
```

---

## 🔧 الخطوة 13: إعداد Firewall

```bash
# تفعيل UFW
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable

# التحقق من الحالة
ufw status
```

---

## ✅ التحقق النهائي

### 1. تحقق من Backend
```bash
curl http://localhost:8001/api/health
# يجب أن يرد: {"status":"healthy"}
```

### 2. تحقق من MongoDB
```bash
mongosh --eval "db.stats()"
```

### 3. تحقق من Supervisor
```bash
supervisorctl status gamelo-backend
# يجب أن يظهر: RUNNING
```

### 4. تحقق من الموقع
افتح المتصفح وزُر: `https://YOUR_DOMAIN.com`

---

## 🔄 أوامر مفيدة

### إعادة تشغيل الخدمات
```bash
# إعادة تشغيل Backend
supervisorctl restart gamelo-backend

# إعادة تشغيل Nginx
systemctl restart nginx

# إعادة تشغيل MongoDB
systemctl restart mongod
```

### عرض اللوجات
```bash
# لوجات Backend
tail -f /var/log/gamelo/backend.err.log
tail -f /var/log/gamelo/backend.out.log

# لوجات Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### تحديث الكود
```bash
cd /var/www/gamelo

# سحب التحديثات
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

---

## 🔐 بيانات الدخول

| الوصف | القيمة |
|-------|--------|
| **بريد المسؤول** | admin@gamelo.com |
| **كلمة المرور** | admin123 |

> ⚠️ **مهم**: غيّر كلمة المرور فوراً بعد أول تسجيل دخول!

---

## 📞 استكشاف الأخطاء

### المشكلة: الموقع لا يعمل
```bash
# تحقق من Nginx
systemctl status nginx
nginx -t

# تحقق من Backend
supervisorctl status gamelo-backend
curl http://localhost:8001/api/health
```

### المشكلة: خطأ 502 Bad Gateway
```bash
# تحقق من أن Backend يعمل
supervisorctl restart gamelo-backend
tail -f /var/log/gamelo/backend.err.log
```

### المشكلة: خطأ في قاعدة البيانات
```bash
# تحقق من MongoDB
systemctl status mongod
mongosh --eval "db.stats()"
```

### المشكلة: الصور لا تظهر
```bash
# تحقق من صلاحيات مجلد uploads
chown -R www-data:www-data /var/www/gamelo/backend/uploads
chmod -R 755 /var/www/gamelo/backend/uploads
```

---

## 📝 ملاحظات مهمة

1. **غيّر كلمات المرور**: JWT_SECRET و FERNET_KEY و كلمة مرور المسؤول
2. **النسخ الاحتياطي**: قم بعمل نسخ احتياطي دوري لقاعدة البيانات
3. **المراقبة**: راقب اللوجات بشكل دوري
4. **التحديثات الأمنية**: حدّث النظام بشكل دوري

```bash
# نسخ احتياطي لقاعدة البيانات
mongodump --db gamelo_db --out /backup/$(date +%Y%m%d)
```

---

**تم إعداد هذا الدليل بواسطة Gamelo Team 🎮**
