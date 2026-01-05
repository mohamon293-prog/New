#!/bin/bash

###############################################
#                                             #
#   GAMELO - التثبيت التلقائي الكامل          #
#      Hostinger VPS - Ubuntu 22.04           #
#              الإصدار 3.0                    #
#                                             #
###############################################

set -e

# التحقق من root
if [ "$EUID" -ne 0 ]; then
    echo "يجب تشغيل السكريبت بصلاحيات root"
    echo "استخدم: sudo ./install.sh"
    exit 1
fi

clear
echo ""
echo "========================================================"
echo "         GAMELO AUTO INSTALLER v3.0                     "
echo "            Hostinger VPS Edition                       "
echo "========================================================"
echo ""

# إدخال المعلومات
echo "========================================================"
echo "                 أدخل المعلومات المطلوبة               "
echo "========================================================"
echo ""

read -p "أدخل الدومين (مثال: gamelo.org): " DOMAIN
read -p "أدخل البريد الإلكتروني: " EMAIL

DOMAIN=$(echo "$DOMAIN" | sed 's|https://||g' | sed 's|http://||g' | sed 's|/||g' | sed 's|www.||g')

echo ""
echo "========================================================"
echo "  الدومين: $DOMAIN"
echo "  البريد: $EMAIL"
echo "========================================================"
echo ""

read -p "هل المعلومات صحيحة؟ (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "تم الإلغاء"
    exit 0
fi

echo ""
echo "========================================================"
echo "              بدء التثبيت الشامل...                     "
echo "========================================================"
echo ""

# 1. حذف التثبيت القديم
echo "[1/15] حذف التثبيت القديم..."
supervisorctl stop gamelo 2>/dev/null || true
rm -rf /var/www/gamelo
rm -f /etc/supervisor/conf.d/gamelo.conf
rm -f /etc/nginx/sites-enabled/gamelo
rm -f /etc/nginx/sites-available/gamelo
systemctl restart nginx 2>/dev/null || true
echo ">>> تم"

# 2. تحديث النظام
echo "[2/15] تحديث النظام..."
apt update -y > /dev/null 2>&1
apt upgrade -y > /dev/null 2>&1
apt install -y curl wget git build-essential software-properties-common ufw nano htop > /dev/null 2>&1
echo ">>> تم"

# 3. إضافة Swap
echo "[3/15] إضافة Swap Memory (4GB)..."
if [ ! -f /swapfile ]; then
    fallocate -l 4G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=4096 status=none
    chmod 600 /swapfile
    mkswap /swapfile > /dev/null 2>&1
    swapon /swapfile 2>/dev/null || true
    grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
swapon /swapfile 2>/dev/null || true
echo ">>> تم"

# 4. Python 3.11
echo "[4/15] تثبيت Python 3.11..."
add-apt-repository ppa:deadsnakes/ppa -y > /dev/null 2>&1
apt update -y > /dev/null 2>&1
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip > /dev/null 2>&1
echo ">>> تم"

# 5. Node.js 20
echo "[5/15] تثبيت Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
apt install -y nodejs > /dev/null 2>&1
echo ">>> تم"

# 6. MongoDB 7
echo "[6/15] تثبيت MongoDB 7..."
if ! command -v mongod &> /dev/null; then
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor 2>/dev/null
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list > /dev/null
    apt update -y > /dev/null 2>&1
    apt install -y mongodb-org > /dev/null 2>&1
fi
systemctl start mongod 2>/dev/null || true
systemctl enable mongod > /dev/null 2>&1
echo ">>> تم"

# 7. Nginx و Supervisor
echo "[7/15] تثبيت Nginx و Supervisor..."
apt install -y nginx supervisor certbot python3-certbot-nginx > /dev/null 2>&1
systemctl start nginx 2>/dev/null || true
systemctl enable nginx > /dev/null 2>&1
systemctl start supervisor 2>/dev/null || true
systemctl enable supervisor > /dev/null 2>&1
echo ">>> تم"

# 8. تحميل المشروع
echo "[8/15] تحميل المشروع من GitHub..."
mkdir -p /var/www/gamelo
cd /var/www/gamelo
git clone https://github.com/mohamon293-prog/New.git . > /dev/null 2>&1 || {
    echo "فشل تحميل المشروع"
    echo "تأكد أن الـ Repository عام (Public)"
    exit 1
}
echo ">>> تم"

# 9. إعداد Backend
echo "[9/15] إعداد Backend..."
cd /var/www/gamelo/backend

python3.11 -m venv venv
source venv/bin/activate

pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt > /dev/null 2>&1
pip install httpx aiohttp > /dev/null 2>&1

JWT_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
FERNET_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())" 2>/dev/null || echo "")

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
echo ">>> تم"

# 10. إعداد Frontend
echo "[10/15] إعداد Frontend (قد يستغرق 3-5 دقائق)..."
cd /var/www/gamelo/frontend

cat > .env << EOF
REACT_APP_BACKEND_URL=http://$DOMAIN
EOF

npm install > /dev/null 2>&1
npm run build > /dev/null 2>&1

if [ ! -f "build/index.html" ]; then
    echo "فشل بناء Frontend"
    exit 1
fi
echo ">>> تم"

# 11. Supervisor
echo "[11/15] إعداد Supervisor..."
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
EOF

chown -R www-data:www-data /var/www/gamelo
chown -R www-data:www-data /var/log/gamelo
supervisorctl reread > /dev/null 2>&1
supervisorctl update > /dev/null 2>&1
supervisorctl restart gamelo > /dev/null 2>&1 || supervisorctl start gamelo > /dev/null 2>&1
sleep 3
echo ">>> تم"

# 12. Nginx
echo "[12/15] إعداد Nginx..."
cat > /etc/nginx/sites-available/gamelo << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    root /var/www/gamelo/frontend/build;
    index index.html;
    client_max_body_size 100M;
    
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
    
    location /uploads/ {
        alias /var/www/gamelo/backend/uploads/;
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
echo ">>> تم"

# 13. Firewall
echo "[13/15] إعداد Firewall..."
ufw allow ssh > /dev/null 2>&1
ufw allow 'Nginx Full' > /dev/null 2>&1
ufw --force enable > /dev/null 2>&1
echo ">>> تم"

# 14. SSL
echo "[14/15] محاولة الحصول على SSL..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL > /dev/null 2>&1 && {
    cat > /var/www/gamelo/frontend/.env << EOF
REACT_APP_BACKEND_URL=https://$DOMAIN
EOF
    cd /var/www/gamelo/frontend
    npm run build > /dev/null 2>&1
    echo ">>> تم تفعيل HTTPS"
} || {
    echo ">>> SSL غير متاح - الموقع يعمل على HTTP"
}

# 15. إنشاء المسؤول
echo "[15/15] إنشاء حساب المسؤول..."
cd /var/www/gamelo/backend
source venv/bin/activate

python3 << 'PYEOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt, uuid
from datetime import datetime, timezone

async def setup():
    try:
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
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(setup())
PYEOF

deactivate
echo ">>> تم"

# التحقق النهائي
echo ""
echo "========================================================"
echo "                   التحقق النهائي                       "
echo "========================================================"
echo ""

BACKEND_OK=$(supervisorctl status gamelo 2>/dev/null | grep -c "RUNNING" || echo "0")
NGINX_OK=$(systemctl is-active nginx 2>/dev/null)
MONGO_OK=$(systemctl is-active mongod 2>/dev/null)

echo "  MongoDB:  $([ "$MONGO_OK" = "active" ] && echo 'يعمل' || echo 'متوقف')"
echo "  Backend:  $([ "$BACKEND_OK" = "1" ] && echo 'يعمل' || echo 'متوقف')"
echo "  Nginx:    $([ "$NGINX_OK" = "active" ] && echo 'يعمل' || echo 'متوقف')"

echo ""
echo "========================================================"
echo ""
echo "              تم التثبيت بنجاح!                         "
echo ""
echo "========================================================"
echo ""
echo "  الموقع: http://$DOMAIN"
echo ""
echo "  بيانات تسجيل الدخول:"
echo "      البريد: admin@gamelo.com"
echo "      كلمة المرور: admin123"
echo ""
echo "  مهم: غيّر كلمة المرور فوراً!"
echo ""
echo "========================================================"
echo ""
