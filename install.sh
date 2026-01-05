#!/bin/bash

#############################################
#     سكريبت تثبيت Gamelo - Hostinger VPS   #
#     GitHub: mohamon293-prog/New           #
#############################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

clear
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════╗"
echo "║      🎮 Gamelo Auto Installer 🎮         ║"
echo "║         Hostinger VPS Edition            ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# طلب الدومين
echo -e "${YELLOW}أدخل الدومين الخاص بك (مثال: gamelo.com):${NC}"
read -p "الدومين: " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ يجب إدخال الدومين!${NC}"
    exit 1
fi

echo -e "${YELLOW}أدخل بريدك الإلكتروني (للـ SSL):${NC}"
read -p "البريد: " EMAIL

echo ""
echo -e "${GREEN}✅ سيتم التثبيت على: $DOMAIN${NC}"
echo ""

# ============ بدء التثبيت ============

echo -e "${BLUE}[1/10] تحديث النظام...${NC}"
apt update -y && apt upgrade -y
echo -e "${GREEN}✅ تم${NC}"

echo -e "${BLUE}[2/10] تثبيت الأدوات الأساسية...${NC}"
apt install -y curl wget git build-essential software-properties-common ufw
echo -e "${GREEN}✅ تم${NC}"

echo -e "${BLUE}[3/10] تثبيت Python 3.11...${NC}"
add-apt-repository ppa:deadsnakes/ppa -y
apt update -y
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip
echo -e "${GREEN}✅ تم${NC}"

echo -e "${BLUE}[4/10] تثبيت Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
echo -e "${GREEN}✅ تم${NC}"

echo -e "${BLUE}[5/10] تثبيت MongoDB 7...${NC}"
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update -y
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod
echo -e "${GREEN}✅ تم${NC}"

echo -e "${BLUE}[6/10] تثبيت Nginx و Supervisor...${NC}"
apt install -y nginx supervisor certbot python3-certbot-nginx
echo -e "${GREEN}✅ تم${NC}"

echo -e "${BLUE}[7/10] تحميل المشروع من GitHub...${NC}"
rm -rf /var/www/gamelo
mkdir -p /var/www/gamelo
cd /var/www/gamelo
git clone https://github.com/mohamon293-prog/New.git .
echo -e "${GREEN}✅ تم${NC}"

echo -e "${BLUE}[8/10] إعداد Backend...${NC}"
cd /var/www/gamelo/backend

# توليد المفاتيح
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")

# إنشاء البيئة الافتراضية
python3.11 -m venv venv
source venv/bin/activate

# تثبيت المكتبات
pip install --upgrade pip
pip install -r requirements.txt

# توليد FERNET_KEY
FERNET_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")

# إنشاء ملف .env
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=gamelo_db
JWT_SECRET=$JWT_SECRET
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
FERNET_KEY=$FERNET_KEY
EOF

# إنشاء مجلدات الرفع
mkdir -p uploads/products uploads/banners uploads/categories
chmod -R 755 uploads
echo -e "${GREEN}✅ تم${NC}"

echo -e "${BLUE}[9/10] إعداد Frontend...${NC}"
cd /var/www/gamelo/frontend

# إنشاء ملف .env
cat > .env << EOF
REACT_APP_BACKEND_URL=https://$DOMAIN
EOF

# تثبيت وبناء
npm install
npm run build
echo -e "${GREEN}✅ تم${NC}"

echo -e "${BLUE}[10/10] إعداد Nginx و Supervisor...${NC}"

# Supervisor
mkdir -p /var/log/gamelo
cat > /etc/supervisor/conf.d/gamelo.conf << EOF
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

chown -R www-data:www-data /var/www/gamelo
chown -R www-data:www-data /var/log/gamelo

supervisorctl reread
supervisorctl update
supervisorctl start gamelo-backend

# Nginx
cat > /etc/nginx/sites-available/gamelo << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    root /var/www/gamelo/frontend/build;
    index index.html;
    
    client_max_body_size 50M;
    
    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300;
    }
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
EOF

ln -sf /etc/nginx/sites-available/gamelo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
echo -e "${GREEN}✅ تم${NC}"

# إنشاء حساب المسؤول والأقسام
echo -e "${BLUE}إنشاء حساب المسؤول...${NC}"
cd /var/www/gamelo/backend
source venv/bin/activate

python3 << 'PYEOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt, uuid
from datetime import datetime, timezone

async def setup():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.gamelo_db
    now = datetime.now(timezone.utc).isoformat()
    
    # المسؤول
    if not await db.users.find_one({"email": "admin@gamelo.com"}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": "admin@gamelo.com",
            "password_hash": bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode(),
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
        print("✅ تم إنشاء المسؤول")
    
    # الأقسام
    cats = [
        ("playstation", "بلايستيشن", "PlayStation", 1),
        ("xbox", "إكس بوكس", "Xbox", 2),
        ("steam", "ستيم", "Steam", 3),
        ("nintendo", "نينتندو", "Nintendo", 4),
        ("mobile", "ألعاب الجوال", "Mobile", 5),
        ("other", "أخرى", "Other", 6),
    ]
    for cid, name, name_en, order in cats:
        if not await db.categories.find_one({"id": cid}):
            await db.categories.insert_one({
                "id": cid, "name": name, "name_en": name_en,
                "slug": cid, "order": order, "is_active": True,
                "created_at": now, "updated_at": now
            })
    print("✅ تم إنشاء الأقسام")

asyncio.run(setup())
PYEOF

# SSL
echo -e "${BLUE}إعداد SSL...${NC}"
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL || echo -e "${YELLOW}⚠️ تأكد من توجيه DNS${NC}"

# Firewall
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

echo ""
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║          🎉 تم التثبيت بنجاح! 🎉                      ║"
echo "║                                                       ║"
echo "╠═══════════════════════════════════════════════════════╣"
echo "║                                                       ║"
echo "║   🌐 الموقع: https://$DOMAIN"
echo "║                                                       ║"
echo "║   👤 بيانات الدخول:                                   ║"
echo "║      📧 البريد: admin@gamelo.com                      ║"
echo "║      🔑 كلمة المرور: admin123                         ║"
echo "║                                                       ║"
echo "║   ⚠️  غيّر كلمة المرور فوراً!                         ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo -e "${NC}"
