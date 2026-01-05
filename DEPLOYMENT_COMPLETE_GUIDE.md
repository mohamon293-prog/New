# 🎮 دليل رفع Gamelo على Hostinger
## طريقة سهلة ومضمونة 100%

---

# 📋 قبل البدء

## ماذا تحتاج؟
1. ✅ حساب Hostinger مع VPS (خطة KVM 2 أو أعلى)
2. ✅ دومين (مثل: gamelo.store)
3. ✅ 20 دقيقة من وقتك

---

# 🚀 الخطوات

## الخطوة 1: شراء VPS

1. اذهب لـ [hostinger.com](https://hostinger.com)
2. اختر **VPS** → **KVM 2** (أو أعلى)
3. اختر **Ubuntu 22.04**
4. بعد الشراء، ستحصل على:
   - **IP Address**: مثل `185.199.110.153`
   - **Password**: كلمة مرور root

---

## الخطوة 2: ربط الدومين

1. في Hostinger: **Domains** → دومينك → **DNS Zone**
2. أضف:
   ```
   Type: A    Name: @      Points to: IP_الخادم
   Type: A    Name: www    Points to: IP_الخادم
   ```
3. انتظر 10-30 دقيقة

---

## الخطوة 3: الاتصال بالخادم

### من Windows (PowerShell):
```
ssh root@IP_الخادم
```

### من Mac/Linux:
```
ssh root@IP_الخادم
```

أدخل كلمة المرور

---

## الخطوة 4: تشغيل أمر التثبيت

### ⚠️ مهم: غيّر القيم الثلاثة فقط!

انسخ هذا الأمر، غيّر `YOUR_DOMAIN` و `YOUR_EMAIL` و `YOUR_GITHUB_REPO`:

```bash
export DOMAIN="gamelo.org" EMAIL="mohamon291@gmail.com" REPO="https://github.com/mohamon293-prog/New" && bash << 'INSTALL'
#!/bin/bash
set -e
echo "🎮 بدء تثبيت Gamelo..."

# تحديث النظام
apt update -y && apt upgrade -y
apt install -y curl wget git nano ufw gnupg software-properties-common build-essential

# Python
apt install -y python3 python3-pip python3-venv python3-dev

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g yarn

# MongoDB 7
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update -y && apt install -y mongodb-org
systemctl start mongod && systemctl enable mongod

# Nginx
apt install -y nginx certbot python3-certbot-nginx
systemctl start nginx && systemctl enable nginx

# تحميل المشروع
mkdir -p /var/www/gamelo
cd /var/www/gamelo
[ -n "$REPO" ] && git clone "$REPO" . || echo "ارفع الملفات يدوياً"

# مجلدات الرفع
mkdir -p uploads/{images,banners,products}
chmod -R 755 uploads

# Backend
cd /var/www/gamelo/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt 2>/dev/null || pip install fastapi uvicorn motor python-jose bcrypt python-multipart aiofiles cryptography python-dotenv httpx pydantic email-validator

# إنشاء .env
JWT=$(python3 -c "import secrets;print(secrets.token_hex(32))")
ENC=$(python3 -c "from cryptography.fernet import Fernet;print(Fernet.generate_key().decode())")
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=gamelo_production
JWT_SECRET=$JWT
ENCRYPTION_KEY=$ENC
CORS_ORIGINS=https://$DOMAIN,https://www.$DOMAIN
EOF
deactivate

# Frontend
cd /var/www/gamelo/frontend
echo "REACT_APP_BACKEND_URL=https://$DOMAIN/api" > .env
yarn install --network-timeout 600000 || npm install --legacy-peer-deps
NODE_OPTIONS="--max-old-space-size=4096" yarn build || npm run build

# Nginx Config
cat > /etc/nginx/sites-available/gamelo << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
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
EOF

ln -sf /etc/nginx/sites-available/gamelo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Backend Service
cat > /etc/systemd/system/gamelo.service << EOF
[Unit]
Description=Gamelo Backend
After=network.target mongod.service

[Service]
User=root
WorkingDirectory=/var/www/gamelo/backend
Environment="PATH=/var/www/gamelo/backend/venv/bin"
ExecStart=/var/www/gamelo/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable gamelo
systemctl start gamelo

# Firewall
ufw allow 22 && ufw allow 80 && ufw allow 443
echo "y" | ufw enable

# SSL
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL --redirect 2>/dev/null || echo "شغّل SSL يدوياً: certbot --nginx -d $DOMAIN"

# إنشاء حساب المدير
ADMIN_PASS=$(python3 -c "import secrets,string;print(''.join(secrets.choice(string.ascii_letters+string.digits)for _ in range(12)))")
cd /var/www/gamelo/backend
source venv/bin/activate
python3 << ADMIN
import asyncio,bcrypt,uuid,os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime,timezone
from dotenv import load_dotenv
load_dotenv()
async def create():
    c=AsyncIOMotorClient(os.environ['MONGO_URL'])
    d=c[os.environ['DB_NAME']]
    e="admin@$DOMAIN"
    if await d.users.find_one({"email":e}):return
    h=bcrypt.hashpw("$ADMIN_PASS".encode(),bcrypt.gensalt()).decode()
    await d.users.insert_one({"id":str(uuid.uuid4()),"email":e,"password_hash":h,"name":"مدير","role":"admin","role_level":100,"is_active":True,"is_approved":True,"wallet_balance_jod":0,"wallet_balance_usd":0,"created_at":datetime.now(timezone.utc).isoformat()})
asyncio.run(create())
ADMIN
deactivate

# حفظ البيانات
cat > /root/gamelo_info.txt << EOF
═══════════════════════════════════════
       معلومات Gamelo
═══════════════════════════════════════
🌐 الموقع: https://$DOMAIN
🔧 لوحة التحكم: https://$DOMAIN/admin

📧 البريد: admin@$DOMAIN
🔑 كلمة المرور: $ADMIN_PASS

📁 المسارات:
   /var/www/gamelo/backend
   /var/www/gamelo/frontend
   /var/www/gamelo/uploads

🛠️ أوامر مفيدة:
   systemctl restart gamelo
   systemctl restart nginx
   journalctl -u gamelo -f
═══════════════════════════════════════
EOF

clear
echo ""
echo "═══════════════════════════════════════════════"
echo "      🎉 تم التثبيت بنجاح!                    "
echo "═══════════════════════════════════════════════"
echo ""
echo "🌐 الموقع: https://$DOMAIN"
echo "🔧 لوحة التحكم: https://$DOMAIN/admin"
echo ""
echo "📧 البريد: admin@$DOMAIN"
echo "🔑 كلمة المرور: $ADMIN_PASS"
echo ""
echo "═══════════════════════════════════════════════"
echo "⚠️ احفظ كلمة المرور في مكان آمن!"
echo "📄 البيانات محفوظة في: /root/gamelo_info.txt"
echo "═══════════════════════════════════════════════"
INSTALL
```

---

## 📝 مثال عملي:

إذا كان:
- دومينك: `gamelo.store`
- بريدك: `ahmed@gmail.com`
- رابط GitHub: `https://github.com/ahmed/gamelo.git`

انسخ هذا مباشرة:

```bash
export DOMAIN="gamelo.store" EMAIL="ahmed@gmail.com" REPO="https://github.com/ahmed/gamelo.git" && bash << 'INSTALL'
#!/bin/bash
set -e
echo "🎮 بدء تثبيت Gamelo..."
apt update -y && apt upgrade -y
apt install -y curl wget git nano ufw gnupg software-properties-common build-essential
apt install -y python3 python3-pip python3-venv python3-dev
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs && npm install -g yarn
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update -y && apt install -y mongodb-org
systemctl start mongod && systemctl enable mongod
apt install -y nginx certbot python3-certbot-nginx
systemctl start nginx && systemctl enable nginx
mkdir -p /var/www/gamelo && cd /var/www/gamelo
[ -n "$REPO" ] && git clone "$REPO" .
mkdir -p uploads/{images,banners,products} && chmod -R 755 uploads
cd /var/www/gamelo/backend
python3 -m venv venv && source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt 2>/dev/null || pip install fastapi uvicorn motor python-jose bcrypt python-multipart aiofiles cryptography python-dotenv httpx pydantic email-validator
JWT=$(python3 -c "import secrets;print(secrets.token_hex(32))")
ENC=$(python3 -c "from cryptography.fernet import Fernet;print(Fernet.generate_key().decode())")
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=gamelo_production
JWT_SECRET=$JWT
ENCRYPTION_KEY=$ENC
CORS_ORIGINS=https://$DOMAIN,https://www.$DOMAIN
EOF
deactivate
cd /var/www/gamelo/frontend
echo "REACT_APP_BACKEND_URL=https://$DOMAIN/api" > .env
yarn install --network-timeout 600000 || npm install --legacy-peer-deps
NODE_OPTIONS="--max-old-space-size=4096" yarn build || npm run build
cat > /etc/nginx/sites-available/gamelo << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    root /var/www/gamelo/frontend/build;
    index index.html;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    location / { try_files \$uri \$uri/ /index.html; }
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    location /uploads { alias /var/www/gamelo/uploads; expires 30d; add_header Access-Control-Allow-Origin *; }
    client_max_body_size 100M;
}
EOF
ln -sf /etc/nginx/sites-available/gamelo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
cat > /etc/systemd/system/gamelo.service << EOF
[Unit]
Description=Gamelo Backend
After=network.target mongod.service
[Service]
User=root
WorkingDirectory=/var/www/gamelo/backend
Environment="PATH=/var/www/gamelo/backend/venv/bin"
ExecStart=/var/www/gamelo/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2
Restart=always
RestartSec=10
[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload && systemctl enable gamelo && systemctl start gamelo
ufw allow 22 && ufw allow 80 && ufw allow 443 && echo "y" | ufw enable
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL --redirect 2>/dev/null || echo "SSL later: certbot --nginx -d $DOMAIN"
ADMIN_PASS=$(python3 -c "import secrets,string;print(''.join(secrets.choice(string.ascii_letters+string.digits)for _ in range(12)))")
cd /var/www/gamelo/backend && source venv/bin/activate
python3 << ADMIN
import asyncio,bcrypt,uuid,os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime,timezone
from dotenv import load_dotenv
load_dotenv()
async def create():
    c=AsyncIOMotorClient(os.environ['MONGO_URL'])
    d=c[os.environ['DB_NAME']]
    e="admin@$DOMAIN"
    if await d.users.find_one({"email":e}):return
    h=bcrypt.hashpw("$ADMIN_PASS".encode(),bcrypt.gensalt()).decode()
    await d.users.insert_one({"id":str(uuid.uuid4()),"email":e,"password_hash":h,"name":"مدير","role":"admin","role_level":100,"is_active":True,"is_approved":True,"wallet_balance_jod":0,"wallet_balance_usd":0,"created_at":datetime.now(timezone.utc).isoformat()})
asyncio.run(create())
ADMIN
deactivate
cat > /root/gamelo_info.txt << EOF
الموقع: https://$DOMAIN
لوحة التحكم: https://$DOMAIN/admin
البريد: admin@$DOMAIN
كلمة المرور: $ADMIN_PASS
EOF
clear
echo "═══════════════════════════════════════════════"
echo "      🎉 تم التثبيت بنجاح!"
echo "═══════════════════════════════════════════════"
echo "🌐 الموقع: https://$DOMAIN"
echo "🔧 لوحة التحكم: https://$DOMAIN/admin"
echo "📧 البريد: admin@$DOMAIN"
echo "🔑 كلمة المرور: $ADMIN_PASS"
echo "═══════════════════════════════════════════════"
INSTALL
```

---

# ⏱️ الوقت المتوقع

| المرحلة | الوقت |
|---------|-------|
| تحديث النظام | 2-3 دقائق |
| تثبيت البرامج | 5-7 دقائق |
| تحميل المشروع | 1-2 دقائق |
| إعداد Backend | 2-3 دقائق |
| بناء Frontend | 5-8 دقائق |
| الإعدادات النهائية | 2-3 دقائق |
| **المجموع** | **~20 دقيقة** |

---

# ❓ حل المشاكل

## الموقع لا يفتح؟
```bash
systemctl status gamelo
systemctl status nginx
systemctl restart gamelo
systemctl restart nginx
```

## خطأ 502؟
```bash
journalctl -u gamelo -f
# شاهد الخطأ وأصلحه
```

## SSL لا يعمل؟
```bash
# تأكد أن الدومين يشير للخادم
ping yourdomain.com

# ثم شغّل
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

# 🔄 تحديث الموقع لاحقاً

```bash
cd /var/www/gamelo
git pull
cd backend && source venv/bin/activate && pip install -r requirements.txt && deactivate
systemctl restart gamelo
cd ../frontend && yarn install && yarn build
nginx -s reload
```

---

# ✅ قائمة التحقق

بعد التثبيت، تأكد من:

- [ ] الموقع يفتح: `https://yourdomain.com`
- [ ] لوحة التحكم تفتح: `https://yourdomain.com/admin`
- [ ] تسجيل الدخول يعمل
- [ ] المنتجات تظهر
- [ ] الشراء يعمل
- [ ] القفل الأخضر (SSL) موجود

---

**🎮 Gamelo - منصة الألعاب الرقمية**
