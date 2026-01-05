#!/bin/bash

#############################################
#  🎮 سكربت تثبيت Gamelo التلقائي
#  للاستخدام على VPS جديد (Ubuntu 22.04)
#  الإصدار: 2.0
#############################################

set -e

# ألوان للطباعة
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
    echo ""
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

# التحقق من نظام التشغيل
if ! grep -q "Ubuntu" /etc/os-release 2>/dev/null; then
    print_warning "هذا السكربت مصمم لـ Ubuntu 22.04"
    read -p "هل تريد المتابعة؟ (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ]; then
        exit 1
    fi
fi

clear
echo -e "${GREEN}"
cat << "LOGO"
   ██████╗  █████╗ ███╗   ███╗███████╗██╗      ██████╗ 
  ██╔════╝ ██╔══██╗████╗ ████║██╔════╝██║     ██╔═══██╗
  ██║  ███╗███████║██╔████╔██║█████╗  ██║     ██║   ██║
  ██║   ██║██╔══██║██║╚██╔╝██║██╔══╝  ██║     ██║   ██║
  ╚██████╔╝██║  ██║██║ ╚═╝ ██║███████╗███████╗╚██████╔╝
   ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝ ╚═════╝ 
LOGO
echo -e "${NC}"
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}          🎮 سكربت التثبيت التلقائي - الإصدار 2.0${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "  سيقوم هذا السكربت بتثبيت:"
echo "  • Python 3.10+ مع FastAPI"
echo "  • Node.js 20 LTS مع React"
echo "  • MongoDB 7.0"
echo "  • Nginx مع SSL مجاني"
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# طلب المعلومات من المستخدم
echo -e "${YELLOW}📝 أدخل المعلومات المطلوبة:${NC}"
echo ""

read -p "🌐 اسم الدومين (بدون https، مثال: gamelo.com): " DOMAIN
while [ -z "$DOMAIN" ]; do
    print_error "يجب إدخال اسم الدومين"
    read -p "🌐 اسم الدومين: " DOMAIN
done

read -p "📧 بريدك الإلكتروني (لشهادة SSL): " EMAIL
while [ -z "$EMAIL" ]; do
    print_error "يجب إدخال البريد الإلكتروني"
    read -p "📧 بريدك الإلكتروني: " EMAIL
done

read -p "🔗 رابط GitHub للمشروع (اضغط Enter للتخطي): " GITHUB_URL

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}📋 ملخص الإعدادات:${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo "  • الدومين:  $DOMAIN"
echo "  • البريد:   $EMAIL"
if [ -n "$GITHUB_URL" ]; then
    echo "  • GitHub:   $GITHUB_URL"
else
    echo "  • GitHub:   (سيتم رفع الملفات يدوياً)"
fi
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

read -p "هل المعلومات صحيحة؟ (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "تم الإلغاء"
    exit 0
fi

# بدء التثبيت
START_TIME=$(date +%s)

#############################################
# المرحلة 1: تحديث النظام
#############################################
print_step "المرحلة 1/11: تحديث النظام"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y curl wget git nano ufw software-properties-common gnupg lsb-release ca-certificates

#############################################
# المرحلة 2: تثبيت Python
#############################################
print_step "المرحلة 2/11: تثبيت Python 3"
apt-get install -y python3 python3-pip python3-venv python3-dev build-essential
python3 --version
print_info "Python تم تثبيته ✓"

#############################################
# المرحلة 3: تثبيت Node.js
#############################################
print_step "المرحلة 3/11: تثبيت Node.js 20"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g yarn
node --version
npm --version
print_info "Node.js تم تثبيته ✓"

#############################################
# المرحلة 4: تثبيت MongoDB
#############################################
print_step "المرحلة 4/11: تثبيت MongoDB 7.0"

# إزالة أي نسخة قديمة
apt-get remove -y mongodb mongodb-server mongodb-clients 2>/dev/null || true

# إضافة مفتاح MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg 2>/dev/null || true

# إضافة المستودع
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# التثبيت
apt-get update -y
apt-get install -y mongodb-org

# إنشاء مجلد البيانات
mkdir -p /data/db
chown -R mongodb:mongodb /data/db 2>/dev/null || true

# تشغيل MongoDB
systemctl daemon-reload
systemctl enable mongod
systemctl start mongod

# انتظار بدء MongoDB
sleep 5

# التحقق
if systemctl is-active --quiet mongod; then
    print_info "MongoDB يعمل بنجاح ✓"
else
    print_warning "محاولة إعادة تشغيل MongoDB..."
    systemctl restart mongod
    sleep 3
    if systemctl is-active --quiet mongod; then
        print_info "MongoDB يعمل الآن ✓"
    else
        print_error "فشل تشغيل MongoDB - تحقق من: journalctl -u mongod"
    fi
fi

#############################################
# المرحلة 5: تثبيت Nginx
#############################################
print_step "المرحلة 5/11: تثبيت Nginx"
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx
print_info "Nginx يعمل بنجاح ✓"

#############################################
# المرحلة 6: تحميل المشروع
#############################################
print_step "المرحلة 6/11: تحميل ملفات المشروع"

# إنشاء المجلد الرئيسي
mkdir -p /var/www/gamelo
cd /var/www/gamelo

# تحميل من GitHub إذا تم إدخال الرابط
if [ -n "$GITHUB_URL" ]; then
    print_info "جاري تحميل المشروع من GitHub..."
    
    # حذف المحتوى القديم إذا وجد
    rm -rf /var/www/gamelo/* 2>/dev/null || true
    rm -rf /var/www/gamelo/.* 2>/dev/null || true
    
    git clone "$GITHUB_URL" /var/www/gamelo
    
    if [ $? -eq 0 ]; then
        print_info "تم تحميل المشروع بنجاح ✓"
    else
        print_error "فشل تحميل المشروع من GitHub"
        print_info "تأكد من صحة الرابط وأن المستودع عام"
        exit 1
    fi
else
    print_warning "لم يتم إدخال رابط GitHub"
    print_info "يرجى رفع الملفات يدوياً إلى /var/www/gamelo"
    print_info "استخدم FileZilla أو SCP لرفع مجلدي backend و frontend"
    
    # إنشاء هيكل المجلدات
    mkdir -p /var/www/gamelo/backend
    mkdir -p /var/www/gamelo/frontend
fi

# إنشاء مجلدات الملفات المرفوعة
mkdir -p /var/www/gamelo/uploads/images
mkdir -p /var/www/gamelo/uploads/banners
mkdir -p /var/www/gamelo/uploads/products
chmod -R 755 /var/www/gamelo/uploads

#############################################
# المرحلة 7: إعداد Backend
#############################################
print_step "المرحلة 7/11: إعداد Backend"

cd /var/www/gamelo/backend

# التحقق من وجود الملفات
if [ ! -f "server.py" ] && [ ! -f "main.py" ]; then
    print_warning "ملفات Backend غير موجودة بعد"
    print_info "سيتم إنشاء البيئة الافتراضية فقط"
fi

# إنشاء البيئة الافتراضية
python3 -m venv venv
source venv/bin/activate

# تثبيت المكتبات
pip install --upgrade pip wheel setuptools

if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    print_info "تثبيت المكتبات الأساسية..."
    pip install fastapi uvicorn[standard] motor python-jose[cryptography] bcrypt python-multipart aiofiles cryptography python-dotenv httpx pydantic pydantic-settings
fi

# إنشاء مفاتيح التشفير
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
ENCRYPTION_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")

# إنشاء ملف .env
cat > /var/www/gamelo/backend/.env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=gamelo_production
JWT_SECRET=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
CORS_ORIGINS=https://${DOMAIN},https://www.${DOMAIN},http://${DOMAIN},http://www.${DOMAIN}
EOF

print_info "تم إنشاء ملف .env للـ Backend ✓"
deactivate

#############################################
# المرحلة 8: إعداد Frontend
#############################################
print_step "المرحلة 8/11: إعداد Frontend"

cd /var/www/gamelo/frontend

# إنشاء ملف .env
cat > /var/www/gamelo/frontend/.env << EOF
REACT_APP_BACKEND_URL=https://${DOMAIN}/api
EOF

# تثبيت وبناء Frontend
if [ -f "package.json" ]; then
    print_info "جاري تثبيت مكتبات Frontend..."
    
    # استخدام yarn أو npm
    if command -v yarn &> /dev/null; then
        yarn install --network-timeout 600000
    else
        npm install --legacy-peer-deps
    fi
    
    print_info "جاري بناء Frontend... (قد يستغرق 2-5 دقائق)"
    
    # زيادة الذاكرة المتاحة لـ Node
    export NODE_OPTIONS="--max-old-space-size=4096"
    
    if command -v yarn &> /dev/null; then
        yarn build
    else
        npm run build
    fi
    
    if [ -d "build" ]; then
        print_info "تم بناء Frontend بنجاح ✓"
    else
        print_error "فشل بناء Frontend"
    fi
else
    print_warning "ملف package.json غير موجود في frontend"
    print_info "تأكد من رفع ملفات Frontend"
fi

#############################################
# المرحلة 9: إعداد Nginx
#############################################
print_step "المرحلة 9/11: إعداد Nginx"

# إنشاء ملف إعدادات Nginx
cat > /etc/nginx/sites-available/gamelo << NGINXEOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    # الواجهة الأمامية
    root /var/www/gamelo/frontend/build;
    index index.html;

    # ضغط الملفات
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;

    # Frontend Routes
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # الملفات المرفوعة
    location /uploads {
        alias /var/www/gamelo/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin *;
    }

    # حجم الملفات
    client_max_body_size 100M;

    # الأمان
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
NGINXEOF

# تفعيل الموقع
ln -sf /etc/nginx/sites-available/gamelo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# اختبار الإعدادات
nginx -t

if [ $? -eq 0 ]; then
    systemctl reload nginx
    print_info "تم إعداد Nginx بنجاح ✓"
else
    print_error "خطأ في إعدادات Nginx"
    exit 1
fi

#############################################
# المرحلة 10: إنشاء خدمة Backend
#############################################
print_step "المرحلة 10/11: إنشاء خدمة Backend"

cat > /etc/systemd/system/gamelo.service << SERVICEEOF
[Unit]
Description=Gamelo Backend API
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/var/www/gamelo/backend
Environment="PATH=/var/www/gamelo/backend/venv/bin:/usr/local/bin:/usr/bin:/bin"
Environment="PYTHONUNBUFFERED=1"
ExecStart=/var/www/gamelo/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2
Restart=always
RestartSec=10
StandardOutput=append:/var/log/gamelo/backend.log
StandardError=append:/var/log/gamelo/backend-error.log

[Install]
WantedBy=multi-user.target
SERVICEEOF

# إنشاء مجلد السجلات
mkdir -p /var/log/gamelo
touch /var/log/gamelo/backend.log
touch /var/log/gamelo/backend-error.log

# تفعيل وتشغيل الخدمة
systemctl daemon-reload
systemctl enable gamelo

# محاولة تشغيل الخدمة
if [ -f "/var/www/gamelo/backend/server.py" ]; then
    systemctl start gamelo
    sleep 3
    
    if systemctl is-active --quiet gamelo; then
        print_info "Backend يعمل بنجاح ✓"
    else
        print_warning "Backend لم يبدأ بعد - تحقق من الملفات"
    fi
else
    print_warning "ملف server.py غير موجود - الخدمة جاهزة ولكن لم تبدأ"
fi

#############################################
# المرحلة 11: SSL + Firewall
#############################################
print_step "المرحلة 11/11: إعداد SSL والجدار الناري"

# الجدار الناري
print_info "إعداد الجدار الناري..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 27017/tcp  # MongoDB (للتطوير فقط)
echo "y" | ufw enable

# تثبيت Certbot
print_info "تثبيت Certbot..."
apt-get install -y certbot python3-certbot-nginx

# الحصول على شهادة SSL
print_info "جاري الحصول على شهادة SSL..."
certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos -m ${EMAIL} --redirect 2>/dev/null || {
    print_warning "فشل الحصول على SSL تلقائياً"
    print_info "قد يكون الدومين غير موجه للخادم بعد"
    print_info "شغّل هذا الأمر لاحقاً بعد توجيه الدومين:"
    echo ""
    echo "    certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
    echo ""
}

#############################################
# إنشاء حساب المدير
#############################################
print_step "إنشاء حساب المدير"

# توليد كلمة مرور آمنة
ADMIN_PASSWORD=$(python3 -c "import secrets; import string; chars = string.ascii_letters + string.digits; print(''.join(secrets.choice(chars) for _ in range(16)))")
ADMIN_EMAIL="admin@${DOMAIN}"

cd /var/www/gamelo/backend
source venv/bin/activate

python3 << ADMINSCRIPT
import asyncio
import sys
sys.path.insert(0, '/var/www/gamelo/backend')

async def create_admin():
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import bcrypt
        import uuid
        from datetime import datetime, timezone
        import os
        from dotenv import load_dotenv
        
        load_dotenv()
        
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        db_name = os.environ.get('DB_NAME', 'gamelo_production')
        
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
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
            "role_level": 100,
            "permissions": ["*"],
            "is_active": True,
            "is_approved": True,
            "wallet_balance_jod": 0.0,
            "wallet_balance_usd": 0.0,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        print("✅ تم إنشاء حساب المدير بنجاح!")
        
    except Exception as e:
        print(f"⚠️ تحذير: {e}")
        print("يمكنك إنشاء الحساب يدوياً لاحقاً")

asyncio.run(create_admin())
ADMINSCRIPT

deactivate

#############################################
# حساب وقت التثبيت
#############################################
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

#############################################
# انتهى التثبيت!
#############################################
clear
echo ""
echo -e "${GREEN}"
cat << "SUCCESS"
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║         🎉  تم تثبيت Gamelo بنجاح!  🎉                   ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
SUCCESS
echo -e "${NC}"

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}📌 معلومات الموقع${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  🌐 رابط الموقع:      ${GREEN}https://${DOMAIN}${NC}"
echo -e "  🔧 لوحة التحكم:      ${GREEN}https://${DOMAIN}/admin${NC}"
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🔐 بيانات تسجيل الدخول${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  📧 البريد:           ${YELLOW}${ADMIN_EMAIL}${NC}"
echo -e "  🔑 كلمة المرور:      ${YELLOW}${ADMIN_PASSWORD}${NC}"
echo ""
echo -e "${RED}  ⚠️  مهم: احفظ كلمة المرور في مكان آمن!${NC}"
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}📁 المسارات المهمة${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "  • المشروع:     /var/www/gamelo"
echo "  • Backend:     /var/www/gamelo/backend"
echo "  • Frontend:    /var/www/gamelo/frontend"
echo "  • Uploads:     /var/www/gamelo/uploads"
echo "  • السجلات:     /var/log/gamelo/"
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🛠️  أوامر مفيدة${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "  حالة الخدمات:"
echo "    systemctl status gamelo"
echo "    systemctl status nginx"
echo "    systemctl status mongod"
echo ""
echo "  إعادة التشغيل:"
echo "    systemctl restart gamelo"
echo "    systemctl restart nginx"
echo ""
echo "  عرض السجلات:"
echo "    tail -f /var/log/gamelo/backend.log"
echo "    tail -f /var/log/nginx/error.log"
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "⏱️  وقت التثبيت: ${GREEN}${MINUTES} دقيقة و ${SECONDS} ثانية${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# حفظ المعلومات في ملف
cat > /root/gamelo_credentials.txt << CREDENTIALS
═══════════════════════════════════════════════════════════
         معلومات تثبيت Gamelo
         التاريخ: $(date)
═══════════════════════════════════════════════════════════

🌐 الموقع: https://${DOMAIN}
🔧 لوحة التحكم: https://${DOMAIN}/admin

🔐 بيانات المدير:
   البريد: ${ADMIN_EMAIL}
   كلمة المرور: ${ADMIN_PASSWORD}

🔑 مفاتيح التشفير (محفوظة في /var/www/gamelo/backend/.env):
   JWT_SECRET: ${JWT_SECRET}
   ENCRYPTION_KEY: ${ENCRYPTION_KEY}

📁 المسارات:
   المشروع: /var/www/gamelo
   Backend: /var/www/gamelo/backend
   Frontend: /var/www/gamelo/frontend
   Uploads: /var/www/gamelo/uploads

═══════════════════════════════════════════════════════════
CREDENTIALS

chmod 600 /root/gamelo_credentials.txt
echo -e "${GREEN}✅ تم حفظ البيانات في: /root/gamelo_credentials.txt${NC}"
echo ""

# إنشاء سكربت التحديث
cat > /root/update_gamelo.sh << 'UPDATESCRIPT'
#!/bin/bash
echo "🔄 تحديث Gamelo..."
cd /var/www/gamelo
git pull

echo "📦 تحديث Backend..."
cd /var/www/gamelo/backend
source venv/bin/activate
pip install -r requirements.txt
deactivate
systemctl restart gamelo

echo "🎨 تحديث Frontend..."
cd /var/www/gamelo/frontend
yarn install
yarn build

echo "🔄 إعادة تحميل Nginx..."
nginx -s reload

echo "✅ تم التحديث بنجاح!"
UPDATESCRIPT

chmod +x /root/update_gamelo.sh
echo -e "${GREEN}✅ تم إنشاء سكربت التحديث: /root/update_gamelo.sh${NC}"
echo ""
echo -e "${YELLOW}لتحديث الموقع مستقبلاً، شغّل: bash /root/update_gamelo.sh${NC}"
echo ""
