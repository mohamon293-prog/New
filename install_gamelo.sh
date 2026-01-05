#!/bin/bash

#############################################
#  🎮 سكربت تثبيت Gamelo التلقائي
#  للاستخدام على VPS جديد (Ubuntu 22.04)
#############################################

set -e

# ألوان للطباعة
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_error() {
    echo -e "${RED}❌ خطأ: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# التحقق من تشغيل السكربت كـ root
if [ "$EUID" -ne 0 ]; then
    print_error "يجب تشغيل هذا السكربت كـ root"
    echo "استخدم: sudo bash install_gamelo.sh"
    exit 1
fi

clear
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     🎮  مرحباً بك في سكربت تثبيت Gamelo  🎮              ║"
echo "║                                                           ║"
echo "║     سيقوم هذا السكربت بتثبيت:                            ║"
echo "║     • Python 3 + FastAPI                                  ║"
echo "║     • Node.js 20 + React                                  ║"
echo "║     • MongoDB 7.0                                         ║"
echo "║     • Nginx + SSL                                         ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# طلب المعلومات من المستخدم
echo ""
read -p "🌐 أدخل اسم الدومين (مثال: gamelo.com): " DOMAIN
read -p "📧 أدخل بريدك الإلكتروني (للشهادة SSL): " EMAIL
read -p "🔗 أدخل رابط GitHub للمشروع: " GITHUB_URL

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    print_error "يجب إدخال الدومين والبريد الإلكتروني"
    exit 1
fi

echo ""
print_info "سيتم التثبيت بالإعدادات التالية:"
echo "  • الدومين: $DOMAIN"
echo "  • البريد: $EMAIL"
echo "  • GitHub: $GITHUB_URL"
echo ""
read -p "هل تريد المتابعة؟ (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "تم الإلغاء"
    exit 0
fi

#############################################
# المرحلة 1: تحديث النظام
#############################################
print_step "المرحلة 1/10: تحديث النظام"
apt update && apt upgrade -y
apt install -y curl wget git nano ufw software-properties-common

#############################################
# المرحلة 2: تثبيت Python
#############################################
print_step "المرحلة 2/10: تثبيت Python 3"
apt install -y python3 python3-pip python3-venv python3-dev

#############################################
# المرحلة 3: تثبيت Node.js
#############################################
print_step "المرحلة 3/10: تثبيت Node.js 20"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g yarn

#############################################
# المرحلة 4: تثبيت MongoDB
#############################################
print_step "المرحلة 4/10: تثبيت MongoDB 7.0"
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# التحقق من MongoDB
sleep 3
if systemctl is-active --quiet mongod; then
    print_info "MongoDB يعمل بنجاح ✓"
else
    print_error "فشل في تشغيل MongoDB"
    exit 1
fi

#############################################
# المرحلة 5: تثبيت Nginx
#############################################
print_step "المرحلة 5/10: تثبيت Nginx"
apt install -y nginx
systemctl start nginx
systemctl enable nginx

#############################################
# المرحلة 6: تحميل المشروع
#############################################
print_step "المرحلة 6/10: تحميل ملفات المشروع"
mkdir -p /var/www/gamelo
cd /var/www/gamelo

if [ -n "$GITHUB_URL" ]; then
    git clone "$GITHUB_URL" .
else
    print_warning "لم يتم إدخال رابط GitHub"
    print_info "يرجى رفع الملفات يدوياً إلى /var/www/gamelo"
fi

# إنشاء مجلد uploads
mkdir -p /var/www/gamelo/uploads/images
mkdir -p /var/www/gamelo/uploads/banners
mkdir -p /var/www/gamelo/uploads/products
chmod -R 755 /var/www/gamelo/uploads

#############################################
# المرحلة 7: إعداد Backend
#############################################
print_step "المرحلة 7/10: إعداد Backend"
cd /var/www/gamelo/backend

# إنشاء البيئة الافتراضية
python3 -m venv venv
source venv/bin/activate

# تثبيت المكتبات
pip install --upgrade pip
pip install -r requirements.txt 2>/dev/null || pip install fastapi uvicorn motor python-jose bcrypt python-multipart aiofiles cryptography python-dotenv httpx pydantic

# إنشاء مفاتيح التشفير
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
ENCRYPTION_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")

# إنشاء ملف .env
cat > .env << ENVFILE
MONGO_URL=mongodb://localhost:27017
DB_NAME=gamelo_production
JWT_SECRET=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
CORS_ORIGINS=https://${DOMAIN},https://www.${DOMAIN}
ENVFILE

print_info "تم إنشاء ملف .env للـ Backend"
deactivate

#############################################
# المرحلة 8: إعداد Frontend
#############################################
print_step "المرحلة 8/10: إعداد Frontend"
cd /var/www/gamelo/frontend

# إنشاء ملف .env
cat > .env << ENVFILE
REACT_APP_BACKEND_URL=https://${DOMAIN}
ENVFILE

# تثبيت المكتبات وبناء المشروع
if [ -f "package.json" ]; then
    yarn install || npm install
    print_info "جاري بناء Frontend... (قد يستغرق 2-5 دقائق)"
    yarn build || npm run build
else
    print_warning "ملف package.json غير موجود في frontend"
fi

#############################################
# المرحلة 9: إعداد Nginx
#############################################
print_step "المرحلة 9/10: إعداد Nginx"

cat > /etc/nginx/sites-available/gamelo << NGINXCONF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Frontend
    location / {
        root /var/www/gamelo/frontend/build;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Uploaded files
    location /uploads {
        alias /var/www/gamelo/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # File size limit
    client_max_body_size 50M;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
NGINXCONF

# تفعيل الموقع
ln -sf /etc/nginx/sites-available/gamelo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# اختبار وإعادة تشغيل Nginx
nginx -t
systemctl restart nginx

#############################################
# إنشاء خدمة Backend
#############################################
print_step "إنشاء خدمة Gamelo Backend"

cat > /etc/systemd/system/gamelo.service << SERVICECONF
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
SERVICECONF

systemctl daemon-reload
systemctl enable gamelo
systemctl start gamelo

# انتظار بدء الخدمة
sleep 5

if systemctl is-active --quiet gamelo; then
    print_info "Backend يعمل بنجاح ✓"
else
    print_warning "قد يكون هناك مشكلة في Backend، تحقق بـ: journalctl -u gamelo -f"
fi

#############################################
# المرحلة 10: SSL + Firewall
#############################################
print_step "المرحلة 10/10: إعداد SSL والجدار الناري"

# الجدار الناري
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

# SSL (Certbot)
apt install -y certbot python3-certbot-nginx

print_info "جاري الحصول على شهادة SSL..."
certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos -m ${EMAIL} || {
    print_warning "فشل الحصول على SSL تلقائياً"
    print_info "يمكنك تشغيله يدوياً لاحقاً بـ:"
    echo "certbot --nginx -d ${DOMAIN}"
}

#############################################
# إنشاء حساب المدير
#############################################
print_step "إنشاء حساب المدير"

# توليد كلمة مرور عشوائية
ADMIN_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(12))")
ADMIN_EMAIL="admin@${DOMAIN}"

cd /var/www/gamelo/backend
source venv/bin/activate

python3 << ADMINSCRIPT
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
    
    admin_email = "${ADMIN_EMAIL}"
    admin_password = "${ADMIN_PASSWORD}"
    
    existing = await db.users.find_one({"email": admin_email})
    if existing:
        print(f"الحساب موجود مسبقاً: {admin_email}")
        return
    
    password_hash = bcrypt.hashpw(admin_password.encode(), bcrypt.gensalt()).decode()
    
    await db.users.insert_one({
        "id": str(uuid.uuid4()),
        "email": admin_email,
        "password_hash": password_hash,
        "name": "مدير النظام",
        "role": "admin",
        "is_active": True,
        "is_approved": True,
        "wallet_balance_jod": 0.0,
        "wallet_balance_usd": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    print("تم إنشاء حساب المدير بنجاح!")

asyncio.run(create_admin())
ADMINSCRIPT

deactivate

#############################################
# انتهى التثبيت!
#############################################
clear
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     🎉  تم تثبيت Gamelo بنجاح!  🎉                       ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}📌 معلومات الموقع:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  🌐 رابط الموقع:     ${GREEN}https://${DOMAIN}${NC}"
echo -e "  🔧 لوحة التحكم:     ${GREEN}https://${DOMAIN}/admin${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🔐 بيانات تسجيل الدخول:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  📧 البريد:          ${YELLOW}${ADMIN_EMAIL}${NC}"
echo -e "  🔑 كلمة المرور:     ${YELLOW}${ADMIN_PASSWORD}${NC}"
echo ""
echo -e "${RED}⚠️  مهم: احفظ كلمة المرور هذه في مكان آمن!${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}📁 مسارات مهمة:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "  • المشروع:    /var/www/gamelo"
echo "  • Backend:    /var/www/gamelo/backend"
echo "  • Frontend:   /var/www/gamelo/frontend"
echo "  • Uploads:    /var/www/gamelo/uploads"
echo "  • Nginx:      /etc/nginx/sites-available/gamelo"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🛠️  أوامر مفيدة:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "  إعادة تشغيل Backend:    systemctl restart gamelo"
echo "  إعادة تشغيل Nginx:      systemctl restart nginx"
echo "  عرض سجلات Backend:      journalctl -u gamelo -f"
echo "  عرض سجلات Nginx:        tail -f /var/log/nginx/error.log"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# حفظ المعلومات في ملف
cat > /root/gamelo_credentials.txt << CREDENTIALS
═══════════════════════════════════════════════════════════
         معلومات تثبيت Gamelo - $(date)
═══════════════════════════════════════════════════════════

الموقع: https://${DOMAIN}
لوحة التحكم: https://${DOMAIN}/admin

بيانات المدير:
  البريد: ${ADMIN_EMAIL}
  كلمة المرور: ${ADMIN_PASSWORD}

═══════════════════════════════════════════════════════════
CREDENTIALS

chmod 600 /root/gamelo_credentials.txt
print_info "تم حفظ البيانات في: /root/gamelo_credentials.txt"
echo ""
