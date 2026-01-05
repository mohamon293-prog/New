#!/bin/bash

###############################################
#                                             #
#   🎮 GAMELO - سكريبت التثبيت الكامل 🎮      #
#      Hostinger VPS - Ubuntu 22.04           #
#         الإصدار المحدث والمضمون             #
#                                             #
###############################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_green() { echo -e "${GREEN}$1${NC}"; }
print_blue() { echo -e "${BLUE}$1${NC}"; }
print_yellow() { echo -e "${YELLOW}$1${NC}"; }
print_red() { echo -e "${RED}$1${NC}"; }

clear
echo ""
print_blue "╔═══════════════════════════════════════════╗"
print_blue "║      🎮 GAMELO AUTO INSTALLER 🎮          ║"
print_blue "║         Hostinger VPS Edition             ║"
print_blue "╚═══════════════════════════════════════════╝"
echo ""

# التحقق من root
if [ "$EUID" -ne 0 ]; then
    print_red "❌ يجب تشغيل السكريبت كـ root"
    exit 1
fi

# إدخال المعلومات
print_yellow "أدخل المعلومات المطلوبة:"
echo ""
read -p "🌐 الدومين (مثال: gamelo.org): " DOMAIN
read -p "📧 البريد الإلكتروني: " EMAIL

DOMAIN=$(echo "$DOMAIN" | sed 's|https://||g' | sed 's|http://||g' | sed 's|/||g')

echo ""
print_green "الدومين: $DOMAIN"
print_green "البريد: $EMAIL"
echo ""
read -p "هل المعلومات صحيحة؟ (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    print_red "تم الإلغاء"
    exit 0
fi

echo ""
print_blue "═══════════════════════════════════════════"
print_blue "             بدء التثبيت...                "
print_blue "═══════════════════════════════════════════"
echo ""

# 1. تحديث النظام
print_yellow "[1/12] 📦 تحديث النظام..."
apt update -y > /dev/null 2>&1
apt upgrade -y > /dev/null 2>&1
apt install -y curl wget git build-essential software-properties-common ufw nano > /dev/null 2>&1
print_green "✅ تم"

# 2. إضافة Swap (مهم جداً!)
print_yellow "[2/12] 💾 إضافة Swap Memory..."
if [ ! -f /swapfile ]; then
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile > /dev/null 2>&1
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
print_green "✅ تم"

# 3. Python
print_yellow "[3/12] 🐍 تثبيت Python 3.11..."
add-apt-repository ppa:deadsnakes/ppa -y > /dev/null 2>&1
apt update -y > /dev/null 2>&1
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip > /dev/null 2>&1
print_green "✅ تم"

# 4. Node.js
print_yellow "[4/12] 📗 تثبيت Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
apt install -y nodejs > /dev/null 2>&1
print_green "✅ تم"

# 5. MongoDB
print_yellow "[5/12] 🍃 تثبيت MongoDB..."
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor 2>/dev/null
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list > /dev/null
apt update -y > /dev/null 2>&1
apt install -y mongodb-org > /dev/null 2>&1
systemctl start mongod
systemctl enable mongod > /dev/null 2>&1
print_green "✅ تم"

# 6. Nginx & Supervisor & Certbot
print_yellow "[6/12] 🌐 تثبيت Nginx و Supervisor..."
apt install -y nginx supervisor certbot python3-certbot-nginx > /dev/null 2>&1
systemctl start nginx
systemctl enable nginx > /dev/null 2>&1
print_green "✅ تم"

# 7. تحميل المشروع
print_yellow "[7/12] 📥 تحميل المشروع..."
rm -rf /var/www/gamelo
mkdir -p /var/www/gamelo
cd /var/www/gamelo
git clone https://github.com/mohamon293-prog/New.git . > /dev/null 2>&1
print_green "✅ تم"

# 8. إعداد Backend
print_yellow "[8/12] ⚙️ إعداد Backend..."
cd /var/www/gamelo/backend

python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt > /dev/null 2>&1

JWT_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
FERNET_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")

cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=gamelo_db
JWT_SECRET=$JWT_KEY
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
FERNET_KEY=$FERNET_KEY
EOF

mkdir -p uploads/products uploads/banners uploads/categories
chmod -R 755 uploads
deactivate
print_green "✅ تم"

# 9. إعداد Frontend
print_yellow "[9/12] 🎨 إعداد Frontend (5-10 دقائق)..."
cd /var/www/gamelo/frontend

cat > .env << EOF
REACT_APP_BACKEND_URL=http://$DOMAIN
EOF

rm -rf node_modules package-lock.json
npm install --legacy-peer-deps > /dev/null 2>&1
npm run build > /dev/null 2>&1
print_green "✅ تم"

# 10. Supervisor
print_yellow "[10/12] 🔄 إعداد Supervisor..."
mkdir -p /var/log/gamelo

cat > /etc/supervisor/conf.d/gamelo.conf << EOF
[program:gamelo]
command=/var/www/gamelo/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
directory=/var/www/gamelo/backend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/gamelo/error.log
stdout_logfile=/var/log/gamelo/access.log
EOF

chown -R www-data:www-data /var/www/gamelo
chown -R www-data:www-data /var/log/gamelo
supervisorctl reread > /dev/null 2>&1
supervisorctl update > /dev/null 2>&1
supervisorctl start gamelo > /dev/null 2>&1
print_green "✅ تم"

# 11. Nginx
print_yellow "[11/12] 🌍 إعداد Nginx..."
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
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300;
    }
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

ln -sf /etc/nginx/sites-available/gamelo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t > /dev/null 2>&1
systemctl restart nginx
print_green "✅ تم"

# 12. Firewall & SSL
print_yellow "[12/12] 🔒 إعداد Firewall و SSL..."
ufw allow ssh > /dev/null 2>&1
ufw allow 'Nginx Full' > /dev/null 2>&1
ufw --force enable > /dev/null 2>&1

# محاولة SSL (قد لا يعمل بسبب Rate Limit)
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL > /dev/null 2>&1 || print_yellow "⚠️ SSL سيعمل لاحقاً"
print_green "✅ تم"

# إنشاء المسؤول والأقسام
print_yellow "👤 إنشاء حساب المسؤول..."
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
    
    if not await db.users.find_one({"email": "admin@gamelo.com"}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": "admin@gamelo.com",
            "password_hash": bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode(),
            "name": "مدير النظام", "phone": "", "role": "admin", "role_level": 100,
            "permissions": [], "is_active": True, "is_approved": True,
            "wallet_balance": 0.0, "wallet_balance_jod": 0.0, "wallet_balance_usd": 0.0,
            "created_at": now, "updated_at": now
        })
        print("✅ تم إنشاء المسؤول")
    else:
        print("✅ المسؤول موجود")
    
    for cid, name, name_en, order in [
        ("playstation", "بلايستيشن", "PlayStation", 1),
        ("xbox", "إكس بوكس", "Xbox", 2),
        ("steam", "ستيم", "Steam", 3),
        ("nintendo", "نينتندو", "Nintendo", 4),
        ("mobile", "ألعاب الجوال", "Mobile", 5),
        ("other", "أخرى", "Other", 6)
    ]:
        if not await db.categories.find_one({"id": cid}):
            await db.categories.insert_one({
                "id": cid, "name": name, "name_en": name_en, "slug": cid,
                "order": order, "is_active": True, "created_at": now, "updated_at": now
            })
    print("✅ تم إنشاء الأقسام")

asyncio.run(setup())
PYEOF

deactivate

# النتيجة
echo ""
print_green "╔═══════════════════════════════════════════════════════════╗"
print_green "║                                                           ║"
print_green "║            🎉 تم التثبيت بنجاح! 🎉                        ║"
print_green "║                                                           ║"
print_green "╠═══════════════════════════════════════════════════════════╣"
print_green "║                                                           ║"
print_green "║   🌐 الموقع: http://$DOMAIN"
print_green "║                                                           ║"
print_green "║   👤 بيانات الدخول:                                       ║"
print_green "║      📧 admin@gamelo.com                                  ║"
print_green "║      🔑 admin123                                          ║"
print_green "║                                                           ║"
print_green "╚═══════════════════════════════════════════════════════════╝"
echo ""
print_yellow "⚠️ غيّر كلمة المرور فوراً بعد تسجيل الدخول!"
echo ""
