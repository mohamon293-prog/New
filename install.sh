#!/bin/bash

#############################################
#                                           #
#     🎮 Gamelo Installation Script 🎮      #
#        Hostinger VPS - Ubuntu 22.04       #
#                                           #
#     GitHub: mohamon293-prog/New           #
#                                           #
#############################################

set -e

# ألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# شعار
show_banner() {
    clear
    echo -e "${PURPLE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                                                           ║"
    echo "║     ██████╗  █████╗ ███╗   ███╗███████╗██╗      ██████╗   ║"
    echo "║    ██╔════╝ ██╔══██╗████╗ ████║██╔════╝██║     ██╔═══██╗  ║"
    echo "║    ██║  ███╗███████║██╔████╔██║█████╗  ██║     ██║   ██║  ║"
    echo "║    ██║   ██║██╔══██║██║╚██╔╝██║██╔══╝  ██║     ██║   ██║  ║"
    echo "║    ╚██████╔╝██║  ██║██║ ╚═╝ ██║███████╗███████╗╚██████╔╝  ║"
    echo "║     ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝ ╚═════╝   ║"
    echo "║                                                           ║"
    echo "║           🎮 Hostinger VPS Auto Installer 🎮              ║"
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# رسالة خطأ
error_exit() {
    echo -e "${RED}❌ خطأ: $1${NC}"
    exit 1
}

# رسالة نجاح
success_msg() {
    echo -e "${GREEN}✅ $1${NC}"
}

# رسالة معلومات
info_msg() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# رسالة تحذير
warn_msg() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# شريط التقدم
progress_bar() {
    local current=$1
    local total=$2
    local width=50
    local percentage=$((current * 100 / total))
    local filled=$((width * current / total))
    local empty=$((width - filled))
    
    printf "\r${BLUE}["
    printf "%${filled}s" | tr ' ' '█'
    printf "%${empty}s" | tr ' ' '░'
    printf "] ${percentage}%%${NC}"
}

# التحقق من الروت
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error_exit "يجب تشغيل السكريبت بصلاحيات root. استخدم: sudo ./install.sh"
    fi
}

# التحقق من نظام التشغيل
check_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        if [ "$ID" != "ubuntu" ]; then
            error_exit "هذا السكريبت يعمل فقط على Ubuntu"
        fi
    else
        error_exit "لا يمكن تحديد نظام التشغيل"
    fi
}

# جمع المعلومات
get_user_input() {
    echo ""
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}                    إدخال المعلومات                        ${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    
    # الدومين
    while true; do
        read -p "🌐 أدخل الدومين (مثال: gamelo.com): " DOMAIN
        if [ -n "$DOMAIN" ]; then
            # إزالة https:// أو http:// إذا وجد
            DOMAIN=$(echo "$DOMAIN" | sed 's|https://||g' | sed 's|http://||g' | sed 's|/||g')
            break
        else
            warn_msg "يجب إدخال الدومين"
        fi
    done
    
    # البريد الإلكتروني
    while true; do
        read -p "📧 أدخل بريدك الإلكتروني (للـ SSL): " EMAIL
        if [[ "$EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
            break
        else
            warn_msg "بريد إلكتروني غير صالح"
        fi
    done
    
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}                    تأكيد المعلومات                        ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "   🌐 الدومين: ${CYAN}$DOMAIN${NC}"
    echo -e "   📧 البريد: ${CYAN}$EMAIL${NC}"
    echo ""
    
    read -p "هل المعلومات صحيحة؟ (y/n): " CONFIRM
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
        get_user_input
    fi
}

# تثبيت المتطلبات الأساسية
install_prerequisites() {
    echo ""
    echo -e "${BLUE}[1/12] 📦 تحديث النظام وتثبيت الأدوات الأساسية...${NC}"
    
    apt update -qq
    apt upgrade -y -qq
    apt install -y -qq curl wget git build-essential software-properties-common ufw nano htop
    
    success_msg "تم تحديث النظام"
}

# تثبيت Python
install_python() {
    echo -e "${BLUE}[2/12] 🐍 تثبيت Python 3.11...${NC}"
    
    add-apt-repository ppa:deadsnakes/ppa -y > /dev/null 2>&1
    apt update -qq
    apt install -y -qq python3.11 python3.11-venv python3.11-dev python3-pip
    
    success_msg "تم تثبيت Python $(python3.11 --version)"
}

# تثبيت Node.js
install_nodejs() {
    echo -e "${BLUE}[3/12] 📗 تثبيت Node.js 20...${NC}"
    
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt install -y -qq nodejs
    
    success_msg "تم تثبيت Node.js $(node --version)"
}

# تثبيت MongoDB
install_mongodb() {
    echo -e "${BLUE}[4/12] 🍃 تثبيت MongoDB 7...${NC}"
    
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor 2>/dev/null
    
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list > /dev/null
    
    apt update -qq
    apt install -y -qq mongodb-org
    
    systemctl start mongod
    systemctl enable mongod > /dev/null 2>&1
    
    success_msg "تم تثبيت MongoDB"
}

# تثبيت Nginx
install_nginx() {
    echo -e "${BLUE}[5/12] 🌐 تثبيت Nginx...${NC}"
    
    apt install -y -qq nginx
    systemctl start nginx
    systemctl enable nginx > /dev/null 2>&1
    
    success_msg "تم تثبيت Nginx"
}

# تثبيت Supervisor
install_supervisor() {
    echo -e "${BLUE}[6/12] 🔄 تثبيت Supervisor...${NC}"
    
    apt install -y -qq supervisor
    systemctl start supervisor
    systemctl enable supervisor > /dev/null 2>&1
    
    success_msg "تم تثبيت Supervisor"
}

# تثبيت Certbot
install_certbot() {
    echo -e "${BLUE}[7/12] 🔒 تثبيت Certbot (SSL)...${NC}"
    
    apt install -y -qq certbot python3-certbot-nginx
    
    success_msg "تم تثبيت Certbot"
}

# تحميل المشروع
download_project() {
    echo -e "${BLUE}[8/12] 📥 تحميل المشروع من GitHub...${NC}"
    
    rm -rf /var/www/gamelo
    mkdir -p /var/www/gamelo
    cd /var/www/gamelo
    
    git clone https://github.com/mohamon293-prog/New.git . > /dev/null 2>&1
    
    success_msg "تم تحميل المشروع"
}

# إعداد Backend
setup_backend() {
    echo -e "${BLUE}[9/12] ⚙️ إعداد Backend...${NC}"
    
    cd /var/www/gamelo/backend
    
    # إنشاء البيئة الافتراضية
    python3.11 -m venv venv
    source venv/bin/activate
    
    # تثبيت المكتبات
    pip install --upgrade pip -q
    pip install -r requirements.txt -q
    
    # توليد المفاتيح
    JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
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
    
    deactivate
    
    success_msg "تم إعداد Backend"
}

# إعداد Frontend
setup_frontend() {
    echo -e "${BLUE}[10/12] 🎨 إعداد Frontend...${NC}"
    
    cd /var/www/gamelo/frontend
    
    # إنشاء ملف .env
    cat > .env << EOF
REACT_APP_BACKEND_URL=https://$DOMAIN
EOF
    
    # تثبيت المكتبات وبناء التطبيق
    npm install --silent > /dev/null 2>&1
    npm run build --silent > /dev/null 2>&1
    
    success_msg "تم إعداد Frontend"
}

# إعداد Supervisor و Nginx
setup_services() {
    echo -e "${BLUE}[11/12] 🔧 إعداد Supervisor و Nginx...${NC}"
    
    # إنشاء مجلد اللوجات
    mkdir -p /var/log/gamelo
    
    # إعداد Supervisor
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
    
    # تعيين الصلاحيات
    chown -R www-data:www-data /var/www/gamelo
    chown -R www-data:www-data /var/log/gamelo
    
    # تحديث Supervisor
    supervisorctl reread > /dev/null 2>&1
    supervisorctl update > /dev/null 2>&1
    supervisorctl start gamelo-backend > /dev/null 2>&1
    
    # إعداد Nginx
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
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
EOF
    
    ln -sf /etc/nginx/sites-available/gamelo /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    nginx -t > /dev/null 2>&1
    systemctl restart nginx
    
    success_msg "تم إعداد Supervisor و Nginx"
}

# إعداد SSL و Firewall
setup_ssl_firewall() {
    echo -e "${BLUE}[12/12] 🔒 إعداد SSL و Firewall...${NC}"
    
    # Firewall
    ufw allow ssh > /dev/null 2>&1
    ufw allow 'Nginx Full' > /dev/null 2>&1
    ufw --force enable > /dev/null 2>&1
    
    # SSL
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL > /dev/null 2>&1 || warn_msg "تأكد من توجيه DNS للدومين"
    
    success_msg "تم إعداد SSL و Firewall"
}

# إنشاء حساب المسؤول والأقسام
setup_database() {
    echo ""
    echo -e "${BLUE}📝 إنشاء حساب المسؤول والأقسام...${NC}"
    
    cd /var/www/gamelo/backend
    source venv/bin/activate
    
    python3 << 'PYEOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import uuid
from datetime import datetime, timezone

async def setup():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.gamelo_db
    now = datetime.now(timezone.utc).isoformat()
    
    # المسؤول
    if not await db.users.find_one({"email": "admin@gamelo.com"}):
        password_hash = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode()
        await db.users.insert_one({
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
        })
        print("✅ تم إنشاء حساب المسؤول")
    
    # الأقسام
    categories = [
        ("playstation", "بلايستيشن", "PlayStation", 1),
        ("xbox", "إكس بوكس", "Xbox", 2),
        ("steam", "ستيم", "Steam", 3),
        ("nintendo", "نينتندو", "Nintendo", 4),
        ("mobile", "ألعاب الجوال", "Mobile", 5),
        ("other", "أخرى", "Other", 6),
    ]
    
    for cid, name, name_en, order in categories:
        if not await db.categories.find_one({"id": cid}):
            await db.categories.insert_one({
                "id": cid,
                "name": name,
                "name_en": name_en,
                "slug": cid,
                "order": order,
                "is_active": True,
                "created_at": now,
                "updated_at": now
            })
    print("✅ تم إنشاء الأقسام")

asyncio.run(setup())
PYEOF
    
    deactivate
}

# عرض النتيجة النهائية
show_result() {
    echo ""
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║              🎉 تم التثبيت بنجاح! 🎉                          ║"
    echo "║                                                               ║"
    echo "╠═══════════════════════════════════════════════════════════════╣"
    echo "║                                                               ║"
    echo "║   🌐 الموقع: https://$DOMAIN"
    echo "║                                                               ║"
    echo "║   👤 بيانات الدخول:                                           ║"
    echo "║      📧 البريد: admin@gamelo.com                              ║"
    echo "║      🔑 كلمة المرور: admin123                                 ║"
    echo "║                                                               ║"
    echo "║   ⚠️  مهم: غيّر كلمة المرور فوراً بعد تسجيل الدخول!           ║"
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo -e "${CYAN}📋 أوامر مفيدة:${NC}"
    echo "   إعادة تشغيل Backend: sudo supervisorctl restart gamelo-backend"
    echo "   عرض اللوجات: sudo tail -f /var/log/gamelo/backend.err.log"
    echo "   حالة الخدمات: sudo supervisorctl status"
    echo ""
}

# الدالة الرئيسية
main() {
    show_banner
    check_root
    check_os
    get_user_input
    
    echo ""
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}                    بدء التثبيت                            ${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    
    install_prerequisites
    install_python
    install_nodejs
    install_mongodb
    install_nginx
    install_supervisor
    install_certbot
    download_project
    setup_backend
    setup_frontend
    setup_services
    setup_ssl_firewall
    setup_database
    
    show_result
}

# تشغيل
main
