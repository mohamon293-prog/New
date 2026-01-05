# دليل نشر Gamelo على Hostinger
## Deployment Guide for Hostinger VPS

---

## 📋 المتطلبات الأساسية

### 1. خدمة VPS من Hostinger
- **الخطة الموصى بها**: VPS 2 أو أعلى
- **الذاكرة**: 4GB RAM على الأقل
- **المعالج**: 2 vCPU
- **التخزين**: 50GB SSD
- **نظام التشغيل**: Ubuntu 22.04 LTS

### 2. دومين (نطاق)
- اربط الدومين بـ IP الخادم من لوحة تحكم Hostinger

---

## 🔧 خطوات التثبيت

### الخطوة 1: الاتصال بالخادم

```bash
ssh root@YOUR_SERVER_IP
```

### الخطوة 2: تحديث النظام

```bash
apt update && apt upgrade -y
```

### الخطوة 3: تثبيت المتطلبات

```bash
# تثبيت Python و Node.js
apt install -y python3 python3-pip python3-venv nodejs npm git nginx certbot python3-certbot-nginx

# تثبيت MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod
```

### الخطوة 4: إنشاء مجلد المشروع

```bash
mkdir -p /var/www/gamelo
cd /var/www/gamelo
```

### الخطوة 5: نقل الملفات

**الطريقة 1: من GitHub**
```bash
git clone YOUR_GITHUB_REPO_URL .
```

**الطريقة 2: رفع مباشر عبر SCP (من جهازك المحلي)**
```bash
# من جهازك المحلي
scp -r /path/to/gamelo/* root@YOUR_SERVER_IP:/var/www/gamelo/
```

### الخطوة 6: إعداد Backend

```bash
cd /var/www/gamelo/backend

# إنشاء البيئة الافتراضية
python3 -m venv venv
source venv/bin/activate

# تثبيت المكتبات
pip install -r requirements.txt

# إنشاء ملف .env
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=gamelo_production
JWT_SECRET=YOUR_SUPER_SECRET_JWT_KEY_CHANGE_THIS
ENCRYPTION_KEY=YOUR_ENCRYPTION_KEY_CHANGE_THIS
CORS_ORIGINS=https://yourdomain.com
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
EOF
```

### الخطوة 7: إعداد Frontend

```bash
cd /var/www/gamelo/frontend

# إنشاء ملف .env
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=https://yourdomain.com
EOF

# تثبيت وبناء
npm install
npm run build
```

### الخطوة 8: إعداد Nginx

```bash
cat > /etc/nginx/sites-available/gamelo << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        root /var/www/gamelo/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads {
        alias /var/www/gamelo/backend/uploads;
    }

    client_max_body_size 50M;
}
EOF

# تفعيل الموقع
ln -s /etc/nginx/sites-available/gamelo /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

### الخطوة 9: إعداد شهادة SSL (مجانية)

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### الخطوة 10: إعداد Systemd للـ Backend

```bash
cat > /etc/systemd/system/gamelo-backend.service << 'EOF'
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
EOF

# تفعيل وتشغيل
systemctl daemon-reload
systemctl enable gamelo-backend
systemctl start gamelo-backend
```

### الخطوة 11: إنشاء حساب Admin

```bash
cd /var/www/gamelo/backend
source venv/bin/activate

python3 << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

load_dotenv('.env')

async def create_admin():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    admin_email = "admin@yourdomain.com"
    admin_password = "YourSecurePassword123!"
    
    existing = await db.users.find_one({"email": admin_email})
    if existing:
        print(f"Admin {admin_email} already exists!")
        return
    
    password_hash = bcrypt.hashpw(admin_password.encode(), bcrypt.gensalt()).decode()
    
    admin_doc = {
        "id": str(uuid.uuid4()),
        "email": admin_email,
        "password_hash": password_hash,
        "name": "مدير النظام",
        "role": "admin",
        "is_active": True,
        "is_approved": True,
        "wallet_balance": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(admin_doc)
    print(f"✅ Admin created: {admin_email}")
    print(f"Password: {admin_password}")
    
    client.close()

asyncio.run(create_admin())
EOF
```

---

## 🔍 التحقق من التثبيت

```bash
# التحقق من MongoDB
systemctl status mongod

# التحقق من Backend
systemctl status gamelo-backend

# التحقق من Nginx
systemctl status nginx

# اختبار API
curl https://gamelo.org/api/]
```

---

## 🔄 تحديث المشروع

```bash
cd /var/www/gamelo

# جلب التحديثات
git pull origin main

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
systemctl restart gamelo-backend

# Frontend
cd ../frontend
npm install
npm run build

# مسح Cache
nginx -s reload
```

---

## 🛡️ نصائح الأمان

1. **غيّر كلمات المرور الافتراضية**
2. **فعّل الجدار الناري**:
   ```bash
   ufw allow 22
   ufw allow 80
   ufw allow 443
   ufw enable
   ```
3. **إعداد نسخ احتياطية**:
   ```bash
   # نسخ MongoDB
   mongodump --db gamelo_production --out /backup/$(date +%Y%m%d)
   ```

---

## 📞 الدعم

للمساعدة أو الاستفسارات:
- راجع الـ logs: `journalctl -u gamelo-backend -f`
- تحقق من Nginx: `tail -f /var/log/nginx/error.log`

---

**آخر تحديث**: 2025-01-04
