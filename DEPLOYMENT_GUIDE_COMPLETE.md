# 🎮 دليل رفع موقع Gamelo على Hostinger
## الدليل الشامل - الطريقة اليدوية وطريقة السكربت

---

# 📌 الجزء الأول: التحضيرات المطلوبة

## 1. شراء VPS من Hostinger

1. اذهب إلى [hostinger.com](https://hostinger.com)
2. اختر **VPS Hosting** (ليس Shared Hosting)
3. اختر خطة **KVM 2** أو أعلى:
   - RAM: 4GB
   - CPU: 2 cores  
   - Storage: 50GB SSD
   - السعر: ~$10-15/شهر

4. عند الإعداد اختر:
   - نظام التشغيل: **Ubuntu 22.04 LTS**
   - الموقع: أقرب منطقة لجمهورك

5. بعد الشراء ستحصل على:
   - **IP Address**: مثل `185.199.110.153`
   - **Root Password**: كلمة مرور للدخول

## 2. ربط الدومين بالخادم

1. من لوحة Hostinger → **Domains** → اختر دومينك
2. اذهب إلى **DNS Zone**
3. أضف/عدّل سجلات DNS:

```
Type: A
Name: @
Points to: [IP الخادم]
TTL: 3600

Type: A  
Name: www
Points to: [IP الخادم]
TTL: 3600
```

4. انتظر 5-30 دقيقة للتفعيل

## 3. الاتصال بالخادم

### من Windows:
- حمّل [PuTTY](https://putty.org)
- أو استخدم PowerShell:
```powershell
ssh root@IP_الخادم
```

### من Mac/Linux:
```bash
ssh root@IP_الخادم
```

أدخل كلمة المرور عند الطلب.

---

# 📌 الجزء الثاني: طريقة السكربت التلقائي (الأسهل)

## الخطوة 1: نسخ السكربت للخادم

بعد الاتصال بالخادم، انسخ والصق هذا الأمر **كاملاً**:

```bash
cat > /root/install_gamelo.sh << 'ENDOFSCRIPT'
#!/bin/bash

#############################################
#  🎮 سكربت تثبيت Gamelo التلقائي
#############################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_step() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

if [ "$EUID" -ne 0 ]; then
    echo "يجب تشغيل السكربت كـ root"
    exit 1
fi

clear
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         🎮  سكربت تثبيت Gamelo التلقائي  🎮              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

read -p "🌐 أدخل اسم الدومين (مثال: gamelo.com): " DOMAIN
read -p "📧 أدخل بريدك الإلكتروني: " EMAIL
read -p "🔗 رابط GitHub للمشروع (أو اضغط Enter للتخطي): " GITHUB_URL

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "يجب إدخال الدومين والبريد"
    exit 1
fi

print_step "1/11: تحديث النظام"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y && apt-get upgrade -y
apt-get install -y curl wget git nano ufw software-properties-common gnupg

print_step "2/11: تثبيت Python"
apt-get install -y python3 python3-pip python3-venv python3-dev build-essential

print_step "3/11: تثبيت Node.js 20"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g yarn

print_step "4/11: تثبيت MongoDB 7"
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt-get update -y
apt-get install -y mongodb-org
systemctl start mongod
systemctl enable mongod
sleep 3

print_step "5/11: تثبيت Nginx"
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx

print_step "6/11: تحميل المشروع"
mkdir -p /var/www/gamelo
cd /var/www/gamelo

if [ -n "$GITHUB_URL" ]; then
    rm -rf /var/www/gamelo/* 2>/dev/null || true
    git clone "$GITHUB_URL" /var/www/gamelo || {
        print_warning "فشل تحميل GitHub - ارفع الملفات يدوياً"
    }
fi

mkdir -p /var/www/gamelo/uploads/{images,banners,products}
chmod -R 755 /var/www/gamelo/uploads

print_step "7/11: إعداد Backend"
cd /var/www/gamelo/backend 2>/dev/null || mkdir -p /var/www/gamelo/backend && cd /var/www/gamelo/backend

python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip

if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    pip install fastapi uvicorn[standard] motor python-jose[cryptography] bcrypt python-multipart aiofiles cryptography python-dotenv httpx pydantic
fi

JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
ENCRYPTION_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")

cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=gamelo_production
JWT_SECRET=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
CORS_ORIGINS=https://${DOMAIN},https://www.${DOMAIN}
EOF

deactivate

print_step "8/11: إعداد Frontend"
cd /var/www/gamelo/frontend 2>/dev/null || mkdir -p /var/www/gamelo/frontend && cd /var/www/gamelo/frontend

cat > .env << EOF
REACT_APP_BACKEND_URL=https://${DOMAIN}/api
EOF

if [ -f "package.json" ]; then
    yarn install --network-timeout 600000 || npm install --legacy-peer-deps
    export NODE_OPTIONS="--max-old-space-size=4096"
    yarn build || npm run build
fi

print_step "9/11: إعداد Nginx"
cat > /etc/nginx/sites-available/gamelo << NGINXEOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    root /var/www/gamelo/frontend/build;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /uploads {
        alias /var/www/gamelo/uploads;
        expires 30d;
        add_header Access-Control-Allow-Origin *;
    }

    client_max_body_size 100M;
}
NGINXEOF

ln -sf /etc/nginx/sites-available/gamelo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

print_step "10/11: إنشاء خدمة Backend"
cat > /etc/systemd/system/gamelo.service << SVCEOF
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
SVCEOF

mkdir -p /var/log/gamelo
systemctl daemon-reload
systemctl enable gamelo

if [ -f "/var/www/gamelo/backend/server.py" ]; then
    systemctl start gamelo
fi

print_step "11/11: SSL والجدار الناري"
ufw allow 22
ufw allow 80
ufw allow 443
echo "y" | ufw enable

apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos -m ${EMAIL} --redirect 2>/dev/null || {
    print_warning "فشل SSL - شغّله يدوياً لاحقاً:"
    echo "certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
}

# إنشاء حساب المدير
ADMIN_PASSWORD=$(python3 -c "import secrets; import string; print(''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16)))")
ADMIN_EMAIL="admin@${DOMAIN}"

cd /var/www/gamelo/backend
source venv/bin/activate

python3 << ADMINPY
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt, uuid, os
from datetime import datetime, timezone
from dotenv import load_dotenv
load_dotenv()

async def create_admin():
    try:
        client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
        db = client[os.environ.get('DB_NAME')]
        if await db.users.find_one({"email": "${ADMIN_EMAIL}"}):
            print("الحساب موجود")
            return
        password_hash = bcrypt.hashpw("${ADMIN_PASSWORD}".encode(), bcrypt.gensalt()).decode()
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": "${ADMIN_EMAIL}",
            "password_hash": password_hash,
            "name": "مدير النظام",
            "role": "admin",
            "role_level": 100,
            "is_active": True,
            "is_approved": True,
            "wallet_balance_jod": 0.0,
            "wallet_balance_usd": 0.0,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        print("✅ تم إنشاء حساب المدير")
    except Exception as e:
        print(f"تحذير: {e}")

asyncio.run(create_admin())
ADMINPY

deactivate

# حفظ البيانات
cat > /root/gamelo_credentials.txt << CREDS
═══════════════════════════════════════
    معلومات Gamelo - $(date)
═══════════════════════════════════════
الموقع: https://${DOMAIN}
لوحة التحكم: https://${DOMAIN}/admin

بيانات المدير:
البريد: ${ADMIN_EMAIL}
كلمة المرور: ${ADMIN_PASSWORD}
═══════════════════════════════════════
CREDS
chmod 600 /root/gamelo_credentials.txt

clear
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║            🎉  تم التثبيت بنجاح!  🎉                     ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "🌐 الموقع: ${GREEN}https://${DOMAIN}${NC}"
echo -e "🔧 لوحة التحكم: ${GREEN}https://${DOMAIN}/admin${NC}"
echo ""
echo -e "📧 البريد: ${YELLOW}${ADMIN_EMAIL}${NC}"
echo -e "🔑 كلمة المرور: ${YELLOW}${ADMIN_PASSWORD}${NC}"
echo ""
echo -e "${RED}⚠️ احفظ كلمة المرور!${NC}"
echo ""
echo "البيانات محفوظة في: /root/gamelo_credentials.txt"
echo ""
ENDOFSCRIPT
```

## الخطوة 2: تشغيل السكربت

```bash
chmod +x /root/install_gamelo.sh
bash /root/install_gamelo.sh
```

## الخطوة 3: أدخل المعلومات المطلوبة
- اسم الدومين (مثل: gamelo.store)
- بريدك الإلكتروني
- رابط GitHub (إذا رفعت المشروع)

---

# 📌 الجزء الثالث: الطريقة اليدوية (خطوة بخطوة)

## الخطوة 1: تحديث النظام

```bash
apt update && apt upgrade -y
apt install -y curl wget git nano ufw software-properties-common
```

## الخطوة 2: تثبيت Python

```bash
apt install -y python3 python3-pip python3-venv python3-dev build-essential
python3 --version
```

## الخطوة 3: تثبيت Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g yarn
node --version
```

## الخطوة 4: تثبيت MongoDB 7

```bash
# إضافة مفتاح MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

# إضافة المستودع
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
  https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# التثبيت
apt update
apt install -y mongodb-org

# التشغيل
systemctl start mongod
systemctl enable mongod

# التحقق
systemctl status mongod
```

## الخطوة 5: تثبيت Nginx

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

## الخطوة 6: رفع ملفات المشروع

### طريقة A: من GitHub (إذا حفظت المشروع)

```bash
mkdir -p /var/www/gamelo
cd /var/www/gamelo
git clone https://github.com/اسم_المستخدم/اسم_المشروع.git .
```

### طريقة B: باستخدام FileZilla (الأسهل)

1. حمّل [FileZilla](https://filezilla-project.org/download.php)
2. افتح FileZilla واتصل:
   - Host: `sftp://IP_الخادم`
   - Username: `root`
   - Password: كلمة مرور الخادم
   - Port: `22`
3. انقل مجلدي `backend` و `frontend` إلى `/var/www/gamelo/`

### طريقة C: باستخدام SCP من جهازك

```bash
# من جهازك المحلي (ليس الخادم)
scp -r /path/to/backend root@IP_الخادم:/var/www/gamelo/
scp -r /path/to/frontend root@IP_الخادم:/var/www/gamelo/
```

## الخطوة 7: إنشاء مجلدات الملفات المرفوعة

```bash
mkdir -p /var/www/gamelo/uploads/images
mkdir -p /var/www/gamelo/uploads/banners
mkdir -p /var/www/gamelo/uploads/products
chmod -R 755 /var/www/gamelo/uploads
```

## الخطوة 8: إعداد Backend

```bash
cd /var/www/gamelo/backend

# إنشاء البيئة الافتراضية
python3 -m venv venv
source venv/bin/activate

# تثبيت المكتبات
pip install --upgrade pip
pip install -r requirements.txt

# إنشاء مفتاح التشفير
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# انسخ الناتج!

# إنشاء مفتاح JWT
python3 -c "import secrets; print(secrets.token_hex(32))"
# انسخ الناتج!

# إنشاء ملف .env
nano .env
```

محتوى ملف `.env` (غيّر القيم):
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=gamelo_production
JWT_SECRET=الصق_مفتاح_JWT_هنا
ENCRYPTION_KEY=الصق_مفتاح_التشفير_هنا
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

للحفظ: `Ctrl+X` → `Y` → `Enter`

```bash
deactivate
```

## الخطوة 9: إعداد Frontend

```bash
cd /var/www/gamelo/frontend

# إنشاء ملف .env
nano .env
```

محتوى ملف `.env`:
```
REACT_APP_BACKEND_URL=https://yourdomain.com/api
```

```bash
# تثبيت المكتبات
yarn install
# أو
npm install --legacy-peer-deps

# بناء المشروع (انتظر 2-5 دقائق)
yarn build
# أو
npm run build
```

## الخطوة 10: إعداد Nginx

```bash
nano /etc/nginx/sites-available/gamelo
```

الصق هذا المحتوى (غيّر `yourdomain.com`):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    root /var/www/gamelo/frontend/build;
    index index.html;

    # ضغط الملفات
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Frontend
    location / {
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
        expires 30d;
        add_header Access-Control-Allow-Origin *;
    }

    client_max_body_size 100M;
}
```

```bash
# تفعيل الموقع
ln -sf /etc/nginx/sites-available/gamelo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# اختبار الإعدادات
nginx -t

# إعادة تشغيل Nginx
systemctl reload nginx
```

## الخطوة 11: إنشاء خدمة Backend

```bash
nano /etc/systemd/system/gamelo.service
```

الصق:
```ini
[Unit]
Description=Gamelo Backend API
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

```bash
# تفعيل وتشغيل
systemctl daemon-reload
systemctl enable gamelo
systemctl start gamelo

# التحقق
systemctl status gamelo
```

## الخطوة 12: شهادة SSL (HTTPS مجاني)

```bash
# تثبيت Certbot
apt install -y certbot python3-certbot-nginx

# الحصول على الشهادة (غيّر الدومين)
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

- أدخل بريدك الإلكتروني
- اكتب `Y` للموافقة
- اختر `2` لإعادة التوجيه التلقائي

## الخطوة 13: إعداد الجدار الناري

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

## الخطوة 14: إنشاء حساب المدير

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
    admin_password = "YourStrongPassword123!"
    
    existing = await db.users.find_one({"email": admin_email})
    if existing:
        print(f"الحساب موجود: {admin_email}")
        return
    
    password_hash = bcrypt.hashpw(admin_password.encode(), bcrypt.gensalt()).decode()
    
    await db.users.insert_one({
        "id": str(uuid.uuid4()),
        "email": admin_email,
        "password_hash": password_hash,
        "name": "مدير النظام",
        "role": "admin",
        "role_level": 100,
        "is_active": True,
        "is_approved": True,
        "wallet_balance_jod": 0.0,
        "wallet_balance_usd": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    print(f"✅ تم إنشاء الحساب!")
    print(f"البريد: {admin_email}")
    print(f"كلمة المرور: {admin_password}")

asyncio.run(create_admin())
SCRIPT

deactivate
```

---

# 📌 الجزء الرابع: كيفية حفظ المشروع على GitHub

## من Emergent (الأسهل):

1. في صفحة المشروع، اضغط على **"Save to GitHub"**
2. اختر اسم للمستودع
3. انتظر حتى يكتمل الرفع
4. انسخ رابط المستودع

## يدوياً (إذا لم تعمل الطريقة السابقة):

1. أنشئ حساب على [github.com](https://github.com)
2. أنشئ مستودع جديد (New Repository)
3. من Emergent، حمّل الملفات:
   - اضغط على أيقونة التحميل
   - أو استخدم Terminal لضغط الملفات
4. ارفع الملفات للمستودع

---

# 📌 الجزء الخامس: الأوامر المفيدة

## التحقق من الخدمات:
```bash
systemctl status gamelo      # Backend
systemctl status nginx       # Nginx
systemctl status mongod      # MongoDB
```

## إعادة التشغيل:
```bash
systemctl restart gamelo
systemctl restart nginx
systemctl restart mongod
```

## عرض السجلات:
```bash
journalctl -u gamelo -f              # سجل Backend
tail -f /var/log/nginx/error.log     # سجل Nginx
```

## تحديث الموقع:
```bash
cd /var/www/gamelo
git pull

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
deactivate
systemctl restart gamelo

# Frontend
cd ../frontend
yarn install
yarn build
nginx -s reload
```

---

# 📌 الجزء السادس: حل المشاكل الشائعة

## المشكلة: الموقع لا يفتح
```bash
# تحقق من Nginx
nginx -t
systemctl status nginx

# تحقق من Backend
systemctl status gamelo
journalctl -u gamelo --no-pager | tail -50
```

## المشكلة: خطأ 502 Bad Gateway
```bash
# Backend متوقف
systemctl restart gamelo

# تحقق من المنفذ
netstat -tlnp | grep 8001
```

## المشكلة: خطأ في قاعدة البيانات
```bash
systemctl status mongod
systemctl restart mongod
```

## المشكلة: SSL لا يعمل
```bash
# تأكد أن الدومين يشير للخادم
ping yourdomain.com

# أعد محاولة الحصول على الشهادة
certbot --nginx -d yourdomain.com
```

---

# ✅ قائمة التحقق النهائية

- [ ] VPS يعمل (Ubuntu 22.04)
- [ ] الدومين يشير لـ IP الخادم
- [ ] MongoDB يعمل
- [ ] Backend يعمل (المنفذ 8001)
- [ ] Frontend مبني (مجلد build موجود)
- [ ] Nginx يعمل
- [ ] SSL مفعّل (https يعمل)
- [ ] حساب المدير تم إنشاؤه
- [ ] الموقع يفتح بشكل صحيح
- [ ] لوحة التحكم تعمل (/admin)

---

**آخر تحديث**: يناير 2025
