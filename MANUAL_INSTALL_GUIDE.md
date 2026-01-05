# 🎮 Gamelo - دليل التثبيت اليدوي الشامل

## ⚠️ مهم: قبل البدء
1. تأكد أن لديك **Hostinger VPS KVM 1** أو أعلى
2. نظام التشغيل **Ubuntu 22.04 LTS**
3. الدومين **موجه للسيرفر** (A Record → IP السيرفر)

---

## 📋 الخطوات بالترتيب

### الخطوة 1: الاتصال بالسيرفر
```bash
ssh root@IP_السيرفر
```

---

### الخطوة 2: حذف التثبيت القديم (إن وجد)
```bash
supervisorctl stop gamelo 2>/dev/null
rm -rf /var/www/gamelo
rm -f /etc/supervisor/conf.d/gamelo.conf
rm -f /etc/nginx/sites-enabled/gamelo
rm -f /etc/nginx/sites-available/gamelo
systemctl restart nginx
```

---

### الخطوة 3: تحديث النظام
```bash
apt update -y && apt upgrade -y
apt install -y curl wget git build-essential software-properties-common ufw nano htop
```

---

### الخطوة 4: إضافة Swap Memory (مهم جداً!)
```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

**للتحقق:**
```bash
free -h
```

---

### الخطوة 5: تثبيت Python 3.11
```bash
add-apt-repository ppa:deadsnakes/ppa -y
apt update -y
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip
```

**للتحقق:**
```bash
python3.11 --version
```

---

### الخطوة 6: تثبيت Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

**للتحقق:**
```bash
node --version
npm --version
```

---

### الخطوة 7: تثبيت MongoDB 7
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

apt update -y
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod
```

**للتحقق:**
```bash
systemctl status mongod
```

---

### الخطوة 8: تثبيت Nginx و Supervisor و Certbot
```bash
apt install -y nginx supervisor certbot python3-certbot-nginx
systemctl start nginx
systemctl enable nginx
systemctl start supervisor
systemctl enable supervisor
```

---

### الخطوة 9: تحميل المشروع
```bash
mkdir -p /var/www/gamelo
cd /var/www/gamelo
git clone https://github.com/mohamon293-prog/New.git .
```

---

### الخطوة 10: إعداد Backend
```bash
cd /var/www/gamelo/backend

# إنشاء البيئة الافتراضية
python3.11 -m venv venv
source venv/bin/activate

# تحديث pip
pip install --upgrade pip

# تثبيت المكتبات
pip install -r requirements.txt

# تثبيت المكتبات الإضافية المهمة
pip install httpx aiohttp openpyxl Pillow python-multipart

# إنشاء ملف .env
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=gamelo_db
JWT_SECRET=your_very_long_secret_key_here_make_it_random_1234567890abcdef
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
FERNET_KEY=
EOF

# إنشاء مجلدات الرفع
mkdir -p uploads/products uploads/banners uploads/categories uploads/images
chmod -R 755 uploads

deactivate
```

---

### الخطوة 11: إعداد Frontend
⚠️ **استبدل `gamelo.org` بدومينك**

```bash
cd /var/www/gamelo/frontend

# إنشاء ملف .env
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=http://gamelo.org
EOF

# حذف الملفات القديمة
rm -rf node_modules package-lock.json

# تثبيت المكتبات
npm install --legacy-peer-deps

# بناء التطبيق
npm run build
```

**إذا فشل البناء، جرّب:**
```bash
npm install --legacy-peer-deps --force
npm run build
```

---

### الخطوة 12: إعداد Supervisor
```bash
mkdir -p /var/log/gamelo

cat > /etc/supervisor/conf.d/gamelo.conf << 'EOF'
[program:gamelo]
command=/var/www/gamelo/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
directory=/var/www/gamelo/backend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/gamelo/error.log
stdout_logfile=/var/log/gamelo/access.log
environment=PATH="/var/www/gamelo/backend/venv/bin"
EOF

# تعيين الصلاحيات
chown -R www-data:www-data /var/www/gamelo
chown -R www-data:www-data /var/log/gamelo

# تشغيل الخدمة
supervisorctl reread
supervisorctl update
supervisorctl start gamelo
```

**للتحقق:**
```bash
supervisorctl status gamelo
```

---

### الخطوة 13: إعداد Nginx
⚠️ **استبدل `gamelo.org` بدومينك**

```bash
cat > /etc/nginx/sites-available/gamelo << 'EOF'
server {
    listen 80;
    server_name gamelo.org www.gamelo.org;
    
    root /var/www/gamelo/frontend/build;
    index index.html;
    client_max_body_size 100M;
    
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
    }
    
    location /uploads/ {
        alias /var/www/gamelo/backend/uploads/;
        expires 30d;
    }
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# تفعيل الموقع
ln -sf /etc/nginx/sites-available/gamelo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# اختبار وتشغيل
nginx -t
systemctl restart nginx
```

---

### الخطوة 14: إعداد Firewall
```bash
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable
```

---

### الخطوة 15: إنشاء حساب المسؤول والأقسام
```bash
cd /var/www/gamelo/backend
source venv/bin/activate

python3 << 'PYEOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
from datetime import datetime, timezone

async def setup_database():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.gamelo_db
    now = datetime.now(timezone.utc).isoformat()
    
    # إنشاء المسؤول
    existing = await db.users.find_one({"email": "admin@gamelo.com"})
    if not existing:
        password_hash = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode()
        await db.users.insert_one({
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
        })
        print("✅ تم إنشاء حساب المسؤول")
    else:
        print("✅ المسؤول موجود مسبقاً")
    
    # إنشاء الأقسام
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
    
    print("✅ تم إنشاء الأقسام")

asyncio.run(setup_database())
PYEOF

deactivate
```

---

### الخطوة 16 (اختياري): إعداد SSL
```bash
certbot --nginx -d gamelo.org -d www.gamelo.org --agree-tos --email your@email.com
```

**بعد نجاح SSL، حدّث Frontend:**
```bash
cat > /var/www/gamelo/frontend/.env << 'EOF'
REACT_APP_BACKEND_URL=https://gamelo.org
EOF

cd /var/www/gamelo/frontend
npm run build
```

---

## ✅ التحقق النهائي

```bash
# حالة الخدمات
supervisorctl status gamelo
systemctl status nginx
systemctl status mongod

# اختبار API
curl http://localhost:8001/api/health
curl http://localhost:8001/api/categories
```

---

## 🎉 انتهى!

| البيان | القيمة |
|--------|--------|
| 🌐 **الموقع** | `http://gamelo.org` |
| 📧 **البريد** | `admin@gamelo.com` |
| 🔑 **كلمة المرور** | `admin123` |

⚠️ **غيّر كلمة المرور فوراً!**

---

## 🔧 أوامر مفيدة

```bash
# إعادة تشغيل Backend
sudo supervisorctl restart gamelo

# عرض أخطاء Backend
sudo tail -f /var/log/gamelo/error.log

# عرض أخطاء Nginx
sudo tail -f /var/log/nginx/error.log

# إعادة بناء Frontend
cd /var/www/gamelo/frontend && npm run build

# تحديث الكود من GitHub
cd /var/www/gamelo && git pull
```

---

## 🔍 حل المشاكل الشائعة

### مشكلة: نفاد الذاكرة أثناء npm build
```bash
# تأكد من وجود Swap
free -h

# إذا لم يوجد Swap
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

### مشكلة: تعارض مكتبات npm
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps --force
npm run build
```

### مشكلة: Backend لا يعمل
```bash
# عرض الأخطاء
sudo tail -50 /var/log/gamelo/error.log

# إعادة التشغيل
sudo supervisorctl restart gamelo
```

### مشكلة: الموقع لا يفتح
```bash
# تحقق من Nginx
sudo nginx -t
sudo systemctl restart nginx

# تحقق من Backend
curl http://localhost:8001/api/health
```
