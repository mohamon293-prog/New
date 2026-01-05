#!/bin/bash

#############################################
#  سكريبت تثبيت Gamelo على Hostinger VPS   #
#  التثبيت التلقائي الكامل                  #
#############################################

set -e

# الألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════╗"
echo "║     🎮 Gamelo Installation Script 🎮       ║"
echo "║         Hostinger VPS Deployment           ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

# طلب المعلومات من المستخدم
echo -e "${YELLOW}📝 أدخل المعلومات المطلوبة:${NC}"
echo ""

read -p "🌐 أدخل الدومين (مثال: gamelo.com): " DOMAIN
read -p "📧 أدخل بريدك الإلكتروني (للـ SSL): " EMAIL
read -p "🔗 رابط GitHub للمشروع (مثال: https://github.com/user/repo.git): " GITHUB_URL

# التحقق من المدخلات
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ] || [ -z "$GITHUB_URL" ]; then
    echo -e "${RED}❌ يجب إدخال جميع المعلومات!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ سيتم التثبيت بالإعدادات التالية:${NC}"
echo "   الدومين: $DOMAIN"
echo "   البريد: $EMAIL"
echo "   GitHub: $GITHUB_URL"
echo ""
read -p "هل تريد المتابعة؟ (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo -e "${RED}تم الإلغاء${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}    بدء التثبيت - يرجى الانتظار...    ${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# 1. تحديث النظام
echo -e "${YELLOW}[1/12] 📦 تحديث النظام...${NC}"
apt update && apt upgrade -y > /dev/null 2>&1
echo -e "${GREEN}✅ تم تحديث النظام${NC}"

# 2. تثبيت الأدوات الأساسية
echo -e "${YELLOW}[2/12] 🔧 تثبيت الأدوات الأساسية...${NC}"
apt install -y curl wget git build-essential software-properties-common > /dev/null 2>&1
echo -e "${GREEN}✅ تم تثبيت الأدوات${NC}"

# 3. تثبيت Python
echo -e "${YELLOW}[3/12] 🐍 تثبيت Python 3.11...${NC}"
add-apt-repository ppa:deadsnakes/ppa -y > /dev/null 2>&1
apt update > /dev/null 2>&1
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip > /dev/null 2>&1
echo -e "${GREEN}✅ تم تثبيت Python${NC}"

# 4. تثبيت Node.js
echo -e "${YELLOW}[4/12] 📗 تثبيت Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
apt install -y nodejs > /dev/null 2>&1
echo -e "${GREEN}✅ تم تثبيت Node.js${NC}"

# 5. تثبيت MongoDB
echo -e "${YELLOW}[5/12] 🍃 تثبيت MongoDB...${NC}"
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor 2>/dev/null
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list > /dev/null
apt update > /dev/null 2>&1
apt install -y mongodb-org > /dev/null 2>&1
systemctl start mongod
systemctl enable mongod > /dev/null 2>&1
echo -e "${GREEN}✅ تم تثبيت MongoDB${NC}"

# 6. تثبيت Nginx و Certbot
echo -e "${YELLOW}[6/12] 🌐 تثبيت Nginx و Certbot...${NC}"
apt install -y nginx certbot python3-certbot-nginx supervisor > /dev/null 2>&1
echo -e "${GREEN}✅ تم تثبيت Nginx${NC}"

# 7. استنساخ المشروع
echo -e "${YELLOW}[7/12] 📥 استنساخ المشروع...${NC}"
mkdir -p /var/www/gamelo
cd /var/www/gamelo
git clone "$GITHUB_URL" . > /dev/null 2>&1 || { echo -e "${RED}❌ فشل استنساخ المشروع${NC}"; exit 1; }
echo -e "${GREEN}✅ تم استنساخ المشروع${NC}"

# 8. إعداد Backend
echo -e "${YELLOW}[8/12] ⚙️ إعداد Backend...${NC}"
cd /var/www/gamelo/backend

# توليد المفاتيح
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
FERNET_KEY=$(python3.11 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())" 2>/dev/null || echo "")

# إنشاء البيئة الافتراضية
python3.11 -m venv venv
source venv/bin/activate

# تثبيت المكتبات
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt > /dev/null 2>&1

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
echo -e "${GREEN}✅ تم إعداد Backend${NC}"

# 9. إعداد Frontend
echo -e "${YELLOW}[9/12] 🎨 إعداد Frontend...${NC}"
cd /var/www/gamelo/frontend

# إنشاء ملف .env
cat > .env << EOF
REACT_APP_BACKEND_URL=https://$DOMAIN
EOF

# تثبيت وبناء
npm install > /dev/null 2>&1
npm run build > /dev/null 2>&1
echo -e "${GREEN}✅ تم إعداد Frontend${NC}"

# 10. إعداد Supervisor
echo -e "${YELLOW}[10/12] 🔄 إعداد Supervisor...${NC}"
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

supervisorctl reread > /dev/null 2>&1
supervisorctl update > /dev/null 2>&1
supervisorctl start gamelo-backend > /dev/null 2>&1
echo -e "${GREEN}✅ تم إعداد Supervisor${NC}"

# 11. إعداد Nginx
echo -e "${YELLOW}[11/12] 🌍 إعداد Nginx...${NC}"
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
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
EOF

ln -sf /etc/nginx/sites-available/gamelo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t > /dev/null 2>&1
systemctl restart nginx
echo -e "${GREEN}✅ تم إعداد Nginx${NC}"

# 12. إعداد SSL
echo -e "${YELLOW}[12/12] 🔒 إعداد SSL...${NC}"
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL > /dev/null 2>&1 || echo -e "${YELLOW}⚠️ تأكد من توجيه DNS للدومين${NC}"
echo -e "${GREEN}✅ تم إعداد SSL${NC}"

# إنشاء حساب المسؤول
echo -e "${YELLOW}📝 إنشاء حساب المسؤول...${NC}"
cd /var/www/gamelo/backend
source venv/bin/activate

python3 << 'PYTHON_SCRIPT'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
from datetime import datetime, timezone

async def setup_database():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.gamelo_db
    
    # إنشاء المسؤول
    existing = await db.users.find_one({"email": "admin@gamelo.com"})
    if not existing:
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
        print("✅ تم إنشاء حساب المسؤول")
    
    # إنشاء الأقسام
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
    
    print("✅ تم إنشاء الأقسام")

asyncio.run(setup_database())
PYTHON_SCRIPT

# إعداد Firewall
echo -e "${YELLOW}🔥 إعداد Firewall...${NC}"
ufw allow ssh > /dev/null 2>&1
ufw allow 'Nginx Full' > /dev/null 2>&1
ufw --force enable > /dev/null 2>&1

echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   🎉 تم التثبيت بنجاح! 🎉                                  ║"
echo "║                                                            ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo "║   🌐 الموقع: https://$DOMAIN"
echo "║                                                            ║"
echo "║   👤 بيانات الدخول:                                        ║"
echo "║      البريد: admin@gamelo.com                              ║"
echo "║      كلمة المرور: admin123                                 ║"
echo "║                                                            ║"
echo "║   ⚠️  غيّر كلمة المرور فوراً!                              ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${BLUE}📋 أوامر مفيدة:${NC}"
echo "   إعادة تشغيل Backend: supervisorctl restart gamelo-backend"
echo "   عرض اللوجات: tail -f /var/log/gamelo/backend.err.log"
echo "   حالة الخدمات: supervisorctl status"
echo ""
