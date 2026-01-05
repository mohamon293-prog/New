#!/bin/bash

###############################################
#                                             #
#   🎮 GAMELO - سكريبت التثبيت الشامل 🎮      #
#      Hostinger VPS - Ubuntu 22.04           #
#                                             #
#   يحل جميع المشاكل تلقائياً:                #
#   ✅ نفاد الذاكرة (Swap)                    #
#   ✅ تعارض المكتبات (npm)                   #
#   ✅ المكتبات الناقصة (httpx)               #
#   ✅ إعدادات الخدمات                        #
#                                             #
###############################################

set -e

# ألوان
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo_green() { echo -e "${GREEN}$1${NC}"; }
echo_blue() { echo -e "${BLUE}$1${NC}"; }
echo_yellow() { echo -e "${YELLOW}$1${NC}"; }
echo_red() { echo -e "${RED}$1${NC}"; }

# شعار
clear
echo ""
echo_blue "╔══════════════════════════════════════════════════════╗"
echo_blue "║                                                      ║"
echo_blue "║         🎮 GAMELO AUTO INSTALLER v2.0 🎮             ║"
echo_blue "║            Hostinger VPS Edition                     ║"
echo_blue "║                                                      ║"
echo_blue "╚══════════════════════════════════════════════════════╝"
echo ""

# التحقق من root
if [ "$EUID" -ne 0 ]; then
    echo_red "❌ يجب تشغيل السكريبت بصلاحيات root"
    echo_yellow "استخدم: sudo ./install.sh"
    exit 1
fi

# إدخال المعلومات
echo_yellow "══════════════════════════════════════════════════════"
echo_yellow "                 أدخل المعلومات المطلوبة               "
echo_yellow "══════════════════════════════════════════════════════"
echo ""

read -p "🌐 أدخل الدومين (مثال: gamelo.org): " DOMAIN
read -p "📧 أدخل البريد الإلكتروني: " EMAIL

# تنظيف الدومين
DOMAIN=$(echo "$DOMAIN" | sed 's|https://||g' | sed 's|http://||g' | sed 's|/||g' | sed 's|www.||g')

echo ""
echo_green "═══════════════════════════════════════════════════════"
echo_green "  الدومين: $DOMAIN"
echo_green "  البريد: $EMAIL"
echo_green "═══════════════════════════════════════════════════════"
echo ""

read -p "هل المعلومات صحيحة؟ (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo_red "تم الإلغاء"
    exit 0
fi

echo ""
echo_blue "══════════════════════════════════════════════════════"
echo_blue "              🚀 بدء التثبيت الشامل...                "
echo_blue "══════════════════════════════════════════════════════"
echo ""

# ========================================
# 1. حذف التثبيت القديم
# ========================================
echo_yellow "[1/14] 🗑️ حذف التثبيت القديم..."
supervisorctl stop gamelo 2>/dev/null || true
rm -rf /var/www/gamelo
rm -f /etc/supervisor/conf.d/gamelo.conf
rm -f /etc/nginx/sites-enabled/gamelo
rm -f /etc/nginx/sites-available/gamelo
systemctl restart nginx 2>/dev/null || true
echo_green "✅ تم"

# ========================================
# 2. تحديث النظام
# ========================================
echo_yellow "[2/14] 📦 تحديث النظام..."
apt update -y > /dev/null 2>&1
apt upgrade -y > /dev/null 2>&1
apt install -y curl wget git build-essential software-properties-common ufw nano htop > /dev/null 2>&1
echo_green "✅ تم"

# ========================================
# 3. إضافة Swap Memory (مهم جداً!)
# ========================================
echo_yellow "[3/14] 💾 إضافة Swap Memory (4GB)..."
if [ ! -f /swapfile ]; then
    fallocate -l 4G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=4096 status=none
    chmod 600 /swapfile
    mkswap /swapfile > /dev/null 2>&1
    swapon /swapfile 2>/dev/null || true
    grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo_green "✅ تم إضافة 4GB Swap"
else
    swapon /swapfile 2>/dev/null || true
    echo_green "✅ Swap موجود مسبقاً"
fi

# ========================================
# 4. تثبيت Python 3.11
# ========================================
echo_yellow "[4/14] 🐍 تثبيت Python 3.11..."
add-apt-repository ppa:deadsnakes/ppa -y > /dev/null 2>&1
apt update -y > /dev/null 2>&1
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip > /dev/null 2>&1
echo_green "✅ تم - $(python3.11 --version)"

# ========================================
# 5. تثبيت Node.js 20
# ========================================
echo_yellow "[5/14] 📗 تثبيت Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
apt install -y nodejs > /dev/null 2>&1
echo_green "✅ تم - Node $(node --version)"

# ========================================
# 6. تثبيت MongoDB 7
# ========================================
echo_yellow "[6/14] 🍃 تثبيت MongoDB 7..."
if ! command -v mongod &> /dev/null; then
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor 2>/dev/null
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list > /dev/null
    apt update -y > /dev/null 2>&1
    apt install -y mongodb-org > /dev/null 2>&1
fi
systemctl start mongod
systemctl enable mongod > /dev/null 2>&1
echo_green "✅ تم"

# ========================================
# 7. تثبيت Nginx و Supervisor و Certbot
# ========================================
echo_yellow "[7/14] 🌐 تثبيت Nginx و Supervisor و Certbot..."
apt install -y nginx supervisor certbot python3-certbot-nginx > /dev/null 2>&1
systemctl start nginx
systemctl enable nginx > /dev/null 2>&1
systemctl start supervisor
systemctl enable supervisor > /dev/null 2>&1
echo_green "✅ تم"

# ========================================
# 8. تحميل المشروع من GitHub
# ========================================
echo_yellow "[8/14] 📥 تحميل المشروع من GitHub..."
mkdir -p /var/www/gamelo
cd /var/www/gamelo
git clone https://github.com/mohamon293-prog/New.git . > /dev/null 2>&1 || {
    echo_red "❌ فشل تحميل المشروع. تأكد أن الـ Repo عام (Public)"
    exit 1
}
echo_green "✅ تم"

# ========================================
# 9. إعداد Backend
# ========================================
echo_yellow "[9/14] ⚙️ إعداد Backend..."
cd /var/www/gamelo/backend

# إنشاء البيئة الافتراضية
python3.11 -m venv venv
source venv/bin/activate

# تحديث pip وتثبيت المكتبات
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt > /dev/null 2>&1

# تثبيت المكتبات الإضافية المهمة
pip install httpx aiohttp openpyxl Pillow python-multipart > /dev/null 2>&1

# توليد المفاتيح
JWT_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
FERNET_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")

# إنشاء ملف .env
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=gamelo_db
JWT_SECRET=$JWT_KEY
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
FERNET_KEY=$FERNET_KEY
EOF

# إنشاء مجلدات الرفع
mkdir -p uploads/products uploads/banners uploads/categories uploads/images
chmod -R 755 uploads

deactivate
echo_green "✅ تم"

# ========================================
# 10. إعداد Frontend
# ========================================
echo_yellow "[10/14] 🎨 إعداد Frontend (قد يستغرق 5-10 دقائق)..."
cd /var/www/gamelo/frontend

# إنشاء ملف .env
cat > .env << EOF
REACT_APP_BACKEND_URL=http://$DOMAIN
EOF

# حذف node_modules القديم
rm -rf node_modules package-lock.json

# تثبيت المكتبات مع حل مشكلة التعارض
npm install --legacy-peer-deps > /dev/null 2>&1 || npm install --legacy-peer-deps --force > /dev/null 2>&1

# بناء التطبيق
npm run build > /dev/null 2>&1 || {
    echo_yellow "⚠️ إعادة المحاولة..."
    npm run build --legacy-peer-deps > /dev/null 2>&1
}

if [ ! -d "build" ]; then
    echo_red "❌ فشل بناء Frontend"
    exit 1
fi
echo_green "✅ تم"

# ========================================
# 11. إعداد Supervisor
# ========================================
echo_yellow "[11/14] 🔄 إعداد Supervisor..."
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

# تحديث وتشغيل
supervisorctl reread > /dev/null 2>&1
supervisorctl update > /dev/null 2>&1
supervisorctl restart gamelo > /dev/null 2>&1 || supervisorctl start gamelo > /dev/null 2>&1

# انتظار بدء الخدمة
sleep 3
echo_green "✅ تم"

# ========================================
# 12. إعداد Nginx
# ========================================
echo_yellow "[12/14] 🌍 إعداد Nginx..."

cat > /etc/nginx/sites-available/gamelo << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    root /var/www/gamelo/frontend/build;
    index index.html;
    client_max_body_size 100M;
    
    # API Backend
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
    
    # Uploads
    location /uploads/ {
        alias /var/www/gamelo/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Frontend (React Router)
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

# تفعيل الموقع
ln -sf /etc/nginx/sites-available/gamelo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# اختبار وإعادة تشغيل
nginx -t > /dev/null 2>&1 && systemctl restart nginx
echo_green "✅ تم"

# ========================================
# 13. Firewall و SSL
# ========================================
echo_yellow "[13/14] 🔒 إعداد Firewall و SSL..."

# Firewall
ufw allow ssh > /dev/null 2>&1
ufw allow 'Nginx Full' > /dev/null 2>&1
ufw --force enable > /dev/null 2>&1

# محاولة الحصول على SSL (قد يفشل بسبب Rate Limit)
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL > /dev/null 2>&1 && {
    # تحديث Frontend لاستخدام HTTPS
    cat > /var/www/gamelo/frontend/.env << EOF
REACT_APP_BACKEND_URL=https://$DOMAIN
EOF
    cd /var/www/gamelo/frontend
    npm run build > /dev/null 2>&1
    echo_green "✅ تم تفعيل SSL (HTTPS)"
} || {
    echo_yellow "⚠️ SSL غير متاح حالياً (Rate Limit) - الموقع يعمل على HTTP"
}

# ========================================
# 14. إنشاء حساب المسؤول والأقسام
# ========================================
echo_yellow "[14/14] 👤 إنشاء حساب المسؤول والأقسام..."
cd /var/www/gamelo/backend
source venv/bin/activate

python3 << 'PYEOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
from datetime import datetime, timezone

async def setup_database():
    try:
        client = AsyncIOMotorClient("mongodb://localhost:27017")
        db = client.gamelo_db
        now = datetime.now(timezone.utc).isoformat()
        
        # إنشاء المسؤول
        existing_admin = await db.users.find_one({"email": "admin@gamelo.com"})
        if not existing_admin:
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
        else:
            print("✅ حساب المسؤول موجود مسبقاً")
        
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
        
    except Exception as e:
        print(f"❌ خطأ: {e}")

asyncio.run(setup_database())
PYEOF

deactivate

# ========================================
# التحقق النهائي
# ========================================
echo ""
echo_blue "══════════════════════════════════════════════════════"
echo_blue "                   🔍 التحقق النهائي                  "
echo_blue "══════════════════════════════════════════════════════"
echo ""

# التحقق من الخدمات
BACKEND_STATUS=$(supervisorctl status gamelo 2>/dev/null | grep -c "RUNNING" || echo "0")
NGINX_STATUS=$(systemctl is-active nginx 2>/dev/null || echo "inactive")
MONGO_STATUS=$(systemctl is-active mongod 2>/dev/null || echo "inactive")

# التحقق من API
API_CHECK=$(curl -s http://localhost:8001/api/health 2>/dev/null | grep -c "healthy" || echo "0")

echo "Backend (Supervisor): $([ "$BACKEND_STATUS" = "1" ] && echo '✅ يعمل' || echo '❌ متوقف')"
echo "Nginx: $([ "$NGINX_STATUS" = "active" ] && echo '✅ يعمل' || echo '❌ متوقف')"
echo "MongoDB: $([ "$MONGO_STATUS" = "active" ] && echo '✅ يعمل' || echo '❌ متوقف')"
echo "API Health: $([ "$API_CHECK" = "1" ] && echo '✅ يعمل' || echo '⚠️ تحقق يدوياً')"

# ========================================
# النتيجة النهائية
# ========================================
echo ""
echo_green "╔══════════════════════════════════════════════════════════════╗"
echo_green "║                                                              ║"
echo_green "║              🎉 تم التثبيت بنجاح! 🎉                         ║"
echo_green "║                                                              ║"
echo_green "╠══════════════════════════════════════════════════════════════╣"
echo_green "║                                                              ║"
echo_green "║   🌐 الموقع: http://$DOMAIN"
echo_green "║                                                              ║"
echo_green "║   👤 بيانات تسجيل الدخول:                                    ║"
echo_green "║      📧 البريد: admin@gamelo.com                             ║"
echo_green "║      🔑 كلمة المرور: admin123                                ║"
echo_green "║                                                              ║"
echo_green "║   ⚠️  مهم: غيّر كلمة المرور فوراً بعد تسجيل الدخول!          ║"
echo_green "║                                                              ║"
echo_green "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo_yellow "═══════════════════════════════════════════════════════════════"
echo_yellow "                      📋 أوامر مفيدة                           "
echo_yellow "═══════════════════════════════════════════════════════════════"
echo ""
echo "  إعادة تشغيل Backend:  sudo supervisorctl restart gamelo"
echo "  عرض الأخطاء:          sudo tail -f /var/log/gamelo/error.log"
echo "  حالة الخدمات:         sudo supervisorctl status"
echo "  اختبار API:           curl http://localhost:8001/api/health"
echo ""
