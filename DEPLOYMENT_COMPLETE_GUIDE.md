# 🎮 الدليل الشامل والمفصل لرفع موقع Gamelo على Hostinger
## جميع الطرق المتاحة بالتفصيل الكامل

---

# 📑 فهرس المحتويات

1. [المتطلبات الأساسية](#المتطلبات-الأساسية)
2. [الطريقة الأولى: السكربت التلقائي](#الطريقة-الأولى-السكربت-التلقائي)
3. [الطريقة الثانية: اليدوية الكاملة](#الطريقة-الثانية-اليدوية-الكاملة)
4. [الطريقة الثالثة: FileZilla + الأوامر](#الطريقة-الثالثة-filezilla--الأوامر)
5. [الطريقة الرابعة: GitHub Actions (CI/CD)](#الطريقة-الرابعة-github-actions)
6. [حل المشاكل الشائعة](#حل-المشاكل-الشائعة)
7. [الصيانة والتحديث](#الصيانة-والتحديث)

---

# 📌 المتطلبات الأساسية

## 1. شراء VPS من Hostinger

### الخطوات:
1. اذهب إلى [www.hostinger.com](https://www.hostinger.com)
2. سجّل حساب جديد أو سجّل دخول
3. من القائمة العلوية اختر **VPS**
4. اختر خطة **KVM 2** أو أعلى

### المواصفات المطلوبة:
```
┌─────────────────────────────────────────┐
│  الخطة الموصى بها: KVM 2               │
├─────────────────────────────────────────┤
│  💾 RAM: 4 GB (الحد الأدنى 2 GB)        │
│  💻 CPU: 2 Cores                        │
│  📀 Storage: 50 GB SSD                  │
│  🌐 Bandwidth: 4 TB                     │
│  💵 السعر: ~$10-15/شهر                  │
└─────────────────────────────────────────┘
```

### إعداد VPS:
1. بعد الشراء، اذهب إلى **hPanel** → **VPS**
2. اضغط **Setup** أو **Manage**
3. اختر:
   - **Operating System**: Ubuntu 22.04 LTS
   - **Server Location**: أقرب منطقة لجمهورك
4. انتظر 2-5 دقائق حتى يجهز الخادم
5. ستحصل على:
   ```
   IP Address: xxx.xxx.xxx.xxx
   Username: root
   Password: ************
   ```
   **⚠️ احفظ هذه المعلومات!**

---

## 2. شراء وربط الدومين

### شراء الدومين:
- من Hostinger نفسها، أو
- من [Namecheap](https://namecheap.com)، أو
- من [GoDaddy](https://godaddy.com)

### ربط الدومين بالخادم:

#### إذا الدومين من Hostinger:
1. **hPanel** → **Domains** → اختر دومينك
2. **DNS / Nameservers** → **DNS Zone**
3. أضف/عدّل السجلات:

```
┌──────────┬──────────┬─────────────────────┬──────────┐
│  Type    │  Name    │  Points to          │  TTL     │
├──────────┼──────────┼─────────────────────┼──────────┤
│  A       │  @       │  IP_الخادم          │  3600    │
│  A       │  www     │  IP_الخادم          │  3600    │
└──────────┴──────────┴─────────────────────┴──────────┘
```

#### إذا الدومين من مزود آخر:
1. اذهب للوحة تحكم الدومين
2. ابحث عن **DNS Settings** أو **DNS Zone**
3. أضف نفس السجلات أعلاه
4. أو غيّر Nameservers إلى:
   ```
   ns1.hostinger.com
   ns2.hostinger.com
   ```

### التحقق من الربط:
```bash
# من جهازك أو الخادم
ping yourdomain.com

# يجب أن يظهر IP الخادم
PING yourdomain.com (xxx.xxx.xxx.xxx)
```

**⏱️ ملاحظة**: قد يستغرق تفعيل DNS من 5 دقائق إلى 48 ساعة

---

## 3. الاتصال بالخادم

### من Windows:

#### الطريقة 1: PowerShell (Windows 10/11)
```powershell
ssh root@IP_الخادم
```

#### الطريقة 2: PuTTY
1. حمّل [PuTTY](https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html)
2. افتح PuTTY
3. أدخل:
   - **Host Name**: IP_الخادم
   - **Port**: 22
   - **Connection type**: SSH
4. اضغط **Open**
5. أدخل `root` ثم كلمة المرور

#### الطريقة 3: Windows Terminal
```powershell
ssh root@IP_الخادم
```

### من Mac:
```bash
# افتح Terminal (Cmd + Space، اكتب Terminal)
ssh root@IP_الخادم
```

### من Linux:
```bash
ssh root@IP_الخادم
```

### عند أول اتصال:
```
The authenticity of host 'xxx.xxx.xxx.xxx' can't be established.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```
اكتب: `yes` واضغط Enter

---

# 🚀 الطريقة الأولى: السكربت التلقائي

## المميزات:
- ✅ سريع جداً (15-20 دقيقة)
- ✅ تلقائي 100%
- ✅ لا يحتاج خبرة تقنية
- ✅ ينشئ كل شيء تلقائياً

## العيوب:
- ❌ تحكم أقل في التفاصيل
- ❌ يحتاج نسخ أمر طويل

---

## الخطوة 1: الاتصال بالخادم

```bash
ssh root@IP_الخادم
```
أدخل كلمة المرور

---

## الخطوة 2: إنشاء ملف السكربت

### الطريقة A: نسخ مباشر (الأسهل)

انسخ هذا الأمر **كاملاً** والصقه في Terminal:

```bash
cat > /root/install_gamelo.sh << 'SCRIPTEND'
#!/bin/bash

#############################################
#  🎮 سكربت تثبيت Gamelo التلقائي
#  الإصدار: 3.0
#  التاريخ: يناير 2025
#############################################

set -e

# الألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# الدوال
print_banner() {
    clear
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                                                           ║"
    echo "║   ██████╗  █████╗ ███╗   ███╗███████╗██╗      ██████╗    ║"
    echo "║  ██╔════╝ ██╔══██╗████╗ ████║██╔════╝██║     ██╔═══██╗   ║"
    echo "║  ██║  ███╗███████║██╔████╔██║█████╗  ██║     ██║   ██║   ║"
    echo "║  ██║   ██║██╔══██║██║╚██╔╝██║██╔══╝  ██║     ██║   ██║   ║"
    echo "║  ╚██████╔╝██║  ██║██║ ╚═╝ ██║███████╗███████╗╚██████╔╝   ║"
    echo "║   ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝ ╚═════╝    ║"
    echo "║                                                           ║"
    echo "║         🎮 سكربت التثبيت التلقائي v3.0 🎮                ║"
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  ✅ $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_info() {
    echo -e "${BLUE}  ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}  ⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}  ❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}  ✓ $1${NC}"
}

# التحقق من الصلاحيات
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "يجب تشغيل هذا السكربت كـ root"
        echo "استخدم: sudo bash install_gamelo.sh"
        exit 1
    fi
}

# التحقق من نظام التشغيل
check_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        if [[ "$ID" != "ubuntu" ]] || [[ "${VERSION_ID}" < "22.04" ]]; then
            print_warning "هذا السكربت مصمم لـ Ubuntu 22.04+"
            print_warning "نظامك: $ID $VERSION_ID"
            read -p "هل تريد المتابعة؟ (y/n): " CONTINUE
            if [ "$CONTINUE" != "y" ]; then
                exit 1
            fi
        fi
    fi
}

# جمع المعلومات
get_user_input() {
    echo ""
    echo -e "${MAGENTA}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}  📝 أدخل المعلومات المطلوبة${NC}"
    echo -e "${MAGENTA}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    
    # الدومين
    while true; do
        read -p "  🌐 اسم الدومين (مثال: gamelo.com): " DOMAIN
        if [ -n "$DOMAIN" ]; then
            # إزالة http/https إذا وجد
            DOMAIN=$(echo "$DOMAIN" | sed 's|https\?://||' | sed 's|/.*||')
            break
        fi
        print_error "يجب إدخال اسم الدومين"
    done
    
    # البريد
    while true; do
        read -p "  📧 بريدك الإلكتروني: " EMAIL
        if [[ "$EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
            break
        fi
        print_error "أدخل بريد إلكتروني صحيح"
    done
    
    # GitHub
    echo ""
    print_info "رابط GitHub (اختياري - اضغط Enter للتخطي)"
    print_info "إذا لم تدخل رابط، يمكنك رفع الملفات يدوياً لاحقاً"
    read -p "  🔗 رابط GitHub: " GITHUB_URL
    
    # التأكيد
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  📋 ملخص الإعدادات:${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo "    • الدومين:  $DOMAIN"
    echo "    • البريد:   $EMAIL"
    if [ -n "$GITHUB_URL" ]; then
        echo "    • GitHub:   $GITHUB_URL"
    else
        echo "    • GitHub:   (سيتم رفع الملفات يدوياً)"
    fi
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    
    read -p "  هل المعلومات صحيحة؟ (y/n): " CONFIRM
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
        print_warning "تم الإلغاء"
        exit 0
    fi
}

# تثبيت المتطلبات الأساسية
install_prerequisites() {
    print_step "المرحلة 1/12: تحديث النظام وتثبيت الأدوات الأساسية"
    
    export DEBIAN_FRONTEND=noninteractive
    
    print_info "تحديث قائمة الحزم..."
    apt-get update -y
    
    print_info "ترقية الحزم المثبتة..."
    apt-get upgrade -y
    
    print_info "تثبيت الأدوات الأساسية..."
    apt-get install -y \
        curl \
        wget \
        git \
        nano \
        vim \
        htop \
        ufw \
        software-properties-common \
        gnupg \
        lsb-release \
        ca-certificates \
        apt-transport-https \
        build-essential \
        unzip \
        zip
    
    print_success "تم تثبيت الأدوات الأساسية"
}

# تثبيت Python
install_python() {
    print_step "المرحلة 2/12: تثبيت Python 3"
    
    apt-get install -y \
        python3 \
        python3-pip \
        python3-venv \
        python3-dev \
        python3-setuptools \
        python3-wheel
    
    # التحقق
    PYTHON_VERSION=$(python3 --version)
    print_success "تم تثبيت $PYTHON_VERSION"
}

# تثبيت Node.js
install_nodejs() {
    print_step "المرحلة 3/12: تثبيت Node.js 20 LTS"
    
    # إزالة أي نسخة قديمة
    apt-get remove -y nodejs npm 2>/dev/null || true
    
    # تثبيت Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    # تثبيت yarn
    npm install -g yarn
    
    # التحقق
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    YARN_VERSION=$(yarn --version)
    
    print_success "Node.js: $NODE_VERSION"
    print_success "npm: $NPM_VERSION"
    print_success "yarn: $YARN_VERSION"
}

# تثبيت MongoDB
install_mongodb() {
    print_step "المرحلة 4/12: تثبيت MongoDB 7.0"
    
    # إزالة أي نسخة قديمة
    apt-get remove -y mongodb mongodb-server mongodb-clients 2>/dev/null || true
    rm -f /usr/share/keyrings/mongodb-server-*.gpg 2>/dev/null || true
    
    # إضافة مفتاح MongoDB
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
        gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
    
    # إضافة المستودع
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
        tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    
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
        MONGO_VERSION=$(mongod --version | head -1)
        print_success "MongoDB يعمل: $MONGO_VERSION"
    else
        print_warning "محاولة إعادة تشغيل MongoDB..."
        systemctl restart mongod
        sleep 3
        if systemctl is-active --quiet mongod; then
            print_success "MongoDB يعمل الآن"
        else
            print_error "فشل تشغيل MongoDB"
            print_info "تحقق من: journalctl -u mongod"
        fi
    fi
}

# تثبيت Nginx
install_nginx() {
    print_step "المرحلة 5/12: تثبيت Nginx"
    
    apt-get install -y nginx
    
    # تشغيل Nginx
    systemctl enable nginx
    systemctl start nginx
    
    # التحقق
    if systemctl is-active --quiet nginx; then
        NGINX_VERSION=$(nginx -v 2>&1)
        print_success "Nginx يعمل: $NGINX_VERSION"
    else
        print_error "فشل تشغيل Nginx"
    fi
}

# تحميل المشروع
download_project() {
    print_step "المرحلة 6/12: تحميل ملفات المشروع"
    
    # إنشاء المجلد الرئيسي
    mkdir -p /var/www/gamelo
    cd /var/www/gamelo
    
    if [ -n "$GITHUB_URL" ]; then
        print_info "جاري تحميل المشروع من GitHub..."
        
        # حذف المحتوى القديم
        rm -rf /var/www/gamelo/* 2>/dev/null || true
        rm -rf /var/www/gamelo/.* 2>/dev/null || true
        
        # محاولة التحميل
        if git clone "$GITHUB_URL" /var/www/gamelo; then
            print_success "تم تحميل المشروع من GitHub"
        else
            print_error "فشل تحميل المشروع"
            print_info "تأكد من:"
            print_info "  1. الرابط صحيح"
            print_info "  2. المستودع عام (public)"
            print_info "  3. الاتصال بالإنترنت يعمل"
            print_warning "يمكنك رفع الملفات يدوياً لاحقاً إلى /var/www/gamelo"
        fi
    else
        print_warning "لم يتم إدخال رابط GitHub"
        print_info "يرجى رفع الملفات يدوياً إلى /var/www/gamelo"
        print_info "استخدم FileZilla أو SCP"
        
        # إنشاء هيكل المجلدات
        mkdir -p /var/www/gamelo/backend
        mkdir -p /var/www/gamelo/frontend
    fi
    
    # إنشاء مجلدات الملفات المرفوعة
    mkdir -p /var/www/gamelo/uploads/images
    mkdir -p /var/www/gamelo/uploads/banners
    mkdir -p /var/www/gamelo/uploads/products
    chmod -R 755 /var/www/gamelo/uploads
    
    print_success "تم إعداد مجلدات المشروع"
}

# إعداد Backend
setup_backend() {
    print_step "المرحلة 7/12: إعداد Backend (FastAPI)"
    
    cd /var/www/gamelo/backend 2>/dev/null || {
        mkdir -p /var/www/gamelo/backend
        cd /var/www/gamelo/backend
    }
    
    # إنشاء البيئة الافتراضية
    print_info "إنشاء البيئة الافتراضية..."
    python3 -m venv venv
    source venv/bin/activate
    
    # ترقية pip
    print_info "ترقية pip..."
    pip install --upgrade pip wheel setuptools
    
    # تثبيت المكتبات
    print_info "تثبيت مكتبات Python..."
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
    else
        print_info "تثبيت المكتبات الأساسية..."
        pip install \
            fastapi \
            "uvicorn[standard]" \
            motor \
            "python-jose[cryptography]" \
            bcrypt \
            python-multipart \
            aiofiles \
            cryptography \
            python-dotenv \
            httpx \
            pydantic \
            pydantic-settings \
            email-validator
    fi
    
    # إنشاء مفاتيح التشفير
    print_info "إنشاء مفاتيح التشفير..."
    JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    ENCRYPTION_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
    
    # إنشاء ملف .env
    print_info "إنشاء ملف الإعدادات..."
    cat > /var/www/gamelo/backend/.env << ENVEOF
# إعدادات قاعدة البيانات
MONGO_URL=mongodb://localhost:27017
DB_NAME=gamelo_production

# مفاتيح التشفير (لا تشاركها مع أحد!)
JWT_SECRET=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# إعدادات CORS
CORS_ORIGINS=https://${DOMAIN},https://www.${DOMAIN},http://${DOMAIN},http://www.${DOMAIN}

# إعدادات أخرى
DEBUG=False
ENVEOF
    
    deactivate
    
    print_success "تم إعداد Backend"
}

# إعداد Frontend
setup_frontend() {
    print_step "المرحلة 8/12: إعداد Frontend (React)"
    
    cd /var/www/gamelo/frontend 2>/dev/null || {
        mkdir -p /var/www/gamelo/frontend
        cd /var/www/gamelo/frontend
    }
    
    # إنشاء ملف .env
    print_info "إنشاء ملف الإعدادات..."
    cat > /var/www/gamelo/frontend/.env << ENVEOF
REACT_APP_BACKEND_URL=https://${DOMAIN}/api
ENVEOF
    
    # تثبيت وبناء Frontend
    if [ -f "package.json" ]; then
        print_info "تثبيت مكتبات Node.js..."
        
        # استخدام yarn أو npm
        if command -v yarn &> /dev/null; then
            yarn install --network-timeout 600000 || npm install --legacy-peer-deps
        else
            npm install --legacy-peer-deps
        fi
        
        print_info "بناء Frontend... (قد يستغرق 2-5 دقائق)"
        
        # زيادة الذاكرة المتاحة
        export NODE_OPTIONS="--max-old-space-size=4096"
        
        if command -v yarn &> /dev/null; then
            yarn build || npm run build
        else
            npm run build
        fi
        
        if [ -d "build" ]; then
            print_success "تم بناء Frontend"
        else
            print_error "فشل بناء Frontend"
            print_info "تحقق من الأخطاء أعلاه"
        fi
    else
        print_warning "ملف package.json غير موجود"
        print_info "تأكد من رفع ملفات Frontend"
    fi
}

# إعداد Nginx
setup_nginx() {
    print_step "المرحلة 9/12: إعداد Nginx"
    
    # إنشاء ملف الإعدادات
    print_info "إنشاء ملف إعدادات Nginx..."
    
    cat > /etc/nginx/sites-available/gamelo << NGINXEOF
# Gamelo - Nginx Configuration
# Generated: $(date)

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    # المجلد الجذر
    root /var/www/gamelo/frontend/build;
    index index.html;

    # ضغط الملفات
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;
    gzip_disable "MSIE [1-6]\.";

    # السجلات
    access_log /var/log/nginx/gamelo.access.log;
    error_log /var/log/nginx/gamelo.error.log;

    # Frontend - React Router
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Cache للملفات الثابتة
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        proxy_cache_bypass \$http_upgrade;
    }

    # الملفات المرفوعة
    location /uploads {
        alias /var/www/gamelo/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin *;
        
        # أنواع الملفات المسموحة
        location ~* \.(jpg|jpeg|png|gif|ico|webp|svg|pdf)$ {
            expires 30d;
        }
    }

    # حجم الملفات المسموح رفعها
    client_max_body_size 100M;

    # الأمان
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
NGINXEOF

    # تفعيل الموقع
    print_info "تفعيل الموقع..."
    ln -sf /etc/nginx/sites-available/gamelo /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # اختبار الإعدادات
    print_info "اختبار إعدادات Nginx..."
    if nginx -t; then
        systemctl reload nginx
        print_success "تم إعداد Nginx"
    else
        print_error "خطأ في إعدادات Nginx"
        exit 1
    fi
}

# إنشاء خدمة Backend
create_backend_service() {
    print_step "المرحلة 10/12: إنشاء خدمة Backend"
    
    # إنشاء مجلد السجلات
    mkdir -p /var/log/gamelo
    touch /var/log/gamelo/backend.log
    touch /var/log/gamelo/backend-error.log
    
    # إنشاء ملف الخدمة
    print_info "إنشاء خدمة systemd..."
    
    cat > /etc/systemd/system/gamelo.service << SERVICEEOF
[Unit]
Description=Gamelo Backend API
Documentation=https://github.com/yourusername/gamelo
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/var/www/gamelo/backend

# البيئة
Environment="PATH=/var/www/gamelo/backend/venv/bin:/usr/local/bin:/usr/bin:/bin"
Environment="PYTHONUNBUFFERED=1"

# الأمر
ExecStart=/var/www/gamelo/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2

# إعادة التشغيل
Restart=always
RestartSec=10

# السجلات
StandardOutput=append:/var/log/gamelo/backend.log
StandardError=append:/var/log/gamelo/backend-error.log

[Install]
WantedBy=multi-user.target
SERVICEEOF

    # تفعيل الخدمة
    print_info "تفعيل الخدمة..."
    systemctl daemon-reload
    systemctl enable gamelo
    
    # تشغيل الخدمة إذا وجد server.py
    if [ -f "/var/www/gamelo/backend/server.py" ]; then
        print_info "تشغيل Backend..."
        systemctl start gamelo
        sleep 3
        
        if systemctl is-active --quiet gamelo; then
            print_success "Backend يعمل"
        else
            print_warning "Backend لم يبدأ - تحقق من السجلات"
            print_info "journalctl -u gamelo -f"
        fi
    else
        print_warning "ملف server.py غير موجود"
        print_info "الخدمة جاهزة وستعمل بعد رفع الملفات"
    fi
}

# إعداد SSL
setup_ssl() {
    print_step "المرحلة 11/12: إعداد شهادة SSL (HTTPS)"
    
    # تثبيت Certbot
    print_info "تثبيت Certbot..."
    apt-get install -y certbot python3-certbot-nginx
    
    # الحصول على الشهادة
    print_info "جاري الحصول على شهادة SSL..."
    print_info "هذا يتطلب أن يكون الدومين موجه للخادم"
    
    if certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} \
        --non-interactive \
        --agree-tos \
        -m ${EMAIL} \
        --redirect 2>/dev/null; then
        print_success "تم تفعيل SSL"
    else
        print_warning "فشل الحصول على SSL تلقائياً"
        print_info "الأسباب المحتملة:"
        print_info "  1. الدومين غير موجه للخادم بعد"
        print_info "  2. DNS لم يتفعل بعد (انتظر ساعة)"
        print_info ""
        print_info "شغّل هذا الأمر لاحقاً:"
        echo ""
        echo "    certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
        echo ""
    fi
}

# إعداد الجدار الناري
setup_firewall() {
    print_step "المرحلة 12/12: إعداد الجدار الناري"
    
    print_info "إعداد قواعد UFW..."
    
    # إعادة تعيين القواعد
    ufw --force reset
    
    # القواعد الأساسية
    ufw default deny incoming
    ufw default allow outgoing
    
    # السماح للمنافذ المطلوبة
    ufw allow 22/tcp comment 'SSH'
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    
    # تفعيل الجدار الناري
    echo "y" | ufw enable
    
    print_success "تم إعداد الجدار الناري"
    
    # عرض الحالة
    ufw status verbose
}

# إنشاء حساب المدير
create_admin() {
    print_step "إنشاء حساب المدير"
    
    # توليد كلمة مرور آمنة
    ADMIN_PASSWORD=$(python3 -c "
import secrets
import string
chars = string.ascii_letters + string.digits + '!@#$%'
password = ''.join(secrets.choice(chars) for _ in range(16))
print(password)
")
    ADMIN_EMAIL="admin@${DOMAIN}"
    
    cd /var/www/gamelo/backend
    source venv/bin/activate
    
    print_info "إنشاء حساب المدير..."
    
    python3 << ADMINSCRIPT
import asyncio
import sys

async def create_admin():
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import bcrypt
        import uuid
        import os
        from datetime import datetime, timezone
        from dotenv import load_dotenv
        
        load_dotenv()
        
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        db_name = os.environ.get('DB_NAME', 'gamelo_production')
        
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        admin_email = "${ADMIN_EMAIL}"
        admin_password = "${ADMIN_PASSWORD}"
        
        # التحقق من وجود الحساب
        existing = await db.users.find_one({"email": admin_email})
        if existing:
            print(f"الحساب موجود مسبقاً: {admin_email}")
            return
        
        # تشفير كلمة المرور
        password_hash = bcrypt.hashpw(admin_password.encode(), bcrypt.gensalt()).decode()
        
        # إنشاء الحساب
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
        
    except ImportError as e:
        print(f"تحذير: بعض المكتبات غير موجودة - {e}")
        print("يمكنك إنشاء الحساب يدوياً لاحقاً")
    except Exception as e:
        print(f"تحذير: {e}")

asyncio.run(create_admin())
ADMINSCRIPT

    deactivate
    
    print_success "بيانات المدير:"
    echo "    البريد: $ADMIN_EMAIL"
    echo "    كلمة المرور: $ADMIN_PASSWORD"
}

# حفظ المعلومات
save_credentials() {
    print_info "حفظ المعلومات..."
    
    cat > /root/gamelo_credentials.txt << CREDSEOF
╔═══════════════════════════════════════════════════════════════════╗
║                    معلومات تثبيت Gamelo                          ║
║                    $(date)                          
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  🌐 الموقع:                                                       ║
║     https://${DOMAIN}                                             ║
║                                                                   ║
║  🔧 لوحة التحكم:                                                  ║
║     https://${DOMAIN}/admin                                       ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  🔐 بيانات المدير:                                                ║
║     البريد: ${ADMIN_EMAIL}                                        ║
║     كلمة المرور: ${ADMIN_PASSWORD}                                ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  🔑 مفاتيح التشفير (محفوظة في /var/www/gamelo/backend/.env):     ║
║     JWT_SECRET: ${JWT_SECRET}                                     ║
║     ENCRYPTION_KEY: ${ENCRYPTION_KEY}                             ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  📁 المسارات:                                                     ║
║     المشروع: /var/www/gamelo                                      ║
║     Backend: /var/www/gamelo/backend                              ║
║     Frontend: /var/www/gamelo/frontend                            ║
║     Uploads: /var/www/gamelo/uploads                              ║
║     السجلات: /var/log/gamelo/                                     ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  🛠️ أوامر مفيدة:                                                  ║
║     systemctl status gamelo     - حالة Backend                    ║
║     systemctl restart gamelo    - إعادة تشغيل Backend             ║
║     systemctl status nginx      - حالة Nginx                      ║
║     journalctl -u gamelo -f     - سجلات Backend                   ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
CREDSEOF

    chmod 600 /root/gamelo_credentials.txt
}

# إنشاء سكربت التحديث
create_update_script() {
    cat > /root/update_gamelo.sh << 'UPDATEEOF'
#!/bin/bash

echo "🔄 تحديث Gamelo..."

cd /var/www/gamelo

# تحديث من GitHub
if [ -d ".git" ]; then
    echo "📥 جلب التحديثات من GitHub..."
    git pull
fi

# تحديث Backend
echo "🐍 تحديث Backend..."
cd /var/www/gamelo/backend
source venv/bin/activate
pip install -r requirements.txt 2>/dev/null
deactivate
systemctl restart gamelo

# تحديث Frontend
echo "⚛️ تحديث Frontend..."
cd /var/www/gamelo/frontend
yarn install 2>/dev/null || npm install
yarn build 2>/dev/null || npm run build

# إعادة تحميل Nginx
echo "🔄 إعادة تحميل Nginx..."
nginx -s reload

echo "✅ تم التحديث بنجاح!"
UPDATEEOF

    chmod +x /root/update_gamelo.sh
}

# عرض النتيجة النهائية
show_final_message() {
    clear
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════════════╗"
    echo "║                                                                   ║"
    echo "║            🎉  تم تثبيت Gamelo بنجاح!  🎉                        ║"
    echo "║                                                                   ║"
    echo "╚═══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  📌 معلومات الموقع${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "    🌐 الموقع:         ${GREEN}https://${DOMAIN}${NC}"
    echo -e "    🔧 لوحة التحكم:    ${GREEN}https://${DOMAIN}/admin${NC}"
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  🔐 بيانات تسجيل الدخول${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "    📧 البريد:         ${YELLOW}${ADMIN_EMAIL}${NC}"
    echo -e "    🔑 كلمة المرور:    ${YELLOW}${ADMIN_PASSWORD}${NC}"
    echo ""
    echo -e "${RED}    ⚠️  مهم جداً: احفظ كلمة المرور في مكان آمن!${NC}"
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  📁 الملفات المهمة${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "    • البيانات الكاملة: /root/gamelo_credentials.txt"
    echo "    • سكربت التحديث:   /root/update_gamelo.sh"
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  🛠️ أوامر مفيدة${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "    حالة الخدمات:"
    echo "      systemctl status gamelo"
    echo "      systemctl status nginx"
    echo "      systemctl status mongod"
    echo ""
    echo "    تحديث الموقع:"
    echo "      bash /root/update_gamelo.sh"
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# ═══════════════════════════════════════════════════════════
#                      البرنامج الرئيسي
# ═══════════════════════════════════════════════════════════

main() {
    # بدء حساب الوقت
    START_TIME=$(date +%s)
    
    # التحقق والإعداد
    check_root
    print_banner
    check_os
    get_user_input
    
    # التثبيت
    install_prerequisites
    install_python
    install_nodejs
    install_mongodb
    install_nginx
    download_project
    setup_backend
    setup_frontend
    setup_nginx
    create_backend_service
    setup_ssl
    setup_firewall
    create_admin
    save_credentials
    create_update_script
    
    # حساب الوقت
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    MINUTES=$((DURATION / 60))
    SECONDS=$((DURATION % 60))
    
    # عرض النتيجة
    show_final_message
    
    echo -e "${GREEN}  ⏱️ وقت التثبيت: ${MINUTES} دقيقة و ${SECONDS} ثانية${NC}"
    echo ""
}

# تشغيل البرنامج
main "$@"
SCRIPTEND
```

### الخطوة 3: تشغيل السكربت

```bash
chmod +x /root/install_gamelo.sh
bash /root/install_gamelo.sh
```

### الخطوة 4: أدخل المعلومات المطلوبة

عندما يسألك السكربت:
1. **اسم الدومين**: اكتب دومينك بدون https (مثل: `gamelo.store`)
2. **البريد الإلكتروني**: بريدك الحقيقي
3. **رابط GitHub**: إذا حفظت المشروع على GitHub أدخل الرابط، أو اضغط Enter للتخطي

### الخطوة 5: انتظر اكتمال التثبيت

السكربت سيقوم بـ:
- تحديث النظام
- تثبيت Python, Node.js, MongoDB, Nginx
- إعداد كل شيء تلقائياً
- إنشاء حساب مدير

**⏱️ الوقت المتوقع: 15-25 دقيقة**

---

# 🔧 الطريقة الثانية: اليدوية الكاملة

## المميزات:
- ✅ تحكم كامل في كل خطوة
- ✅ فهم أعمق للنظام
- ✅ سهولة حل المشاكل لاحقاً

## العيوب:
- ❌ تستغرق وقت أطول (30-45 دقيقة)
- ❌ تحتاج تركيز ودقة

---

## الخطوة 1: الاتصال وتحديث النظام

```bash
# الاتصال بالخادم
ssh root@IP_الخادم

# تحديث النظام
apt update && apt upgrade -y

# تثبيت الأدوات الأساسية
apt install -y curl wget git nano ufw software-properties-common gnupg build-essential
```

---

## الخطوة 2: تثبيت Python 3

```bash
# تثبيت Python ومكوناته
apt install -y python3 python3-pip python3-venv python3-dev

# التحقق من الإصدار
python3 --version
# يجب أن يظهر: Python 3.10.x أو أعلى
```

---

## الخطوة 3: تثبيت Node.js 20

```bash
# تثبيت Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# تثبيت yarn
npm install -g yarn

# التحقق
node --version   # يجب: v20.x.x
npm --version    # يجب: 10.x.x
yarn --version   # يجب: 1.22.x
```

---

## الخطوة 4: تثبيت MongoDB 7

```bash
# إضافة مفتاح MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

# إضافة المستودع
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
  https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# تحديث وتثبيت
apt update
apt install -y mongodb-org

# تشغيل MongoDB
systemctl start mongod
systemctl enable mongod

# التحقق من العمل
systemctl status mongod
# يجب أن يظهر: active (running)
```

---

## الخطوة 5: تثبيت Nginx

```bash
# التثبيت
apt install -y nginx

# التشغيل
systemctl start nginx
systemctl enable nginx

# التحقق
systemctl status nginx
# يجب أن يظهر: active (running)

# اختبار في المتصفح
# افتح: http://IP_الخادم
# يجب أن ترى صفحة Nginx الافتراضية
```

---

## الخطوة 6: إنشاء مجلدات المشروع

```bash
# إنشاء المجلد الرئيسي
mkdir -p /var/www/gamelo

# إنشاء مجلدات الملفات المرفوعة
mkdir -p /var/www/gamelo/uploads/images
mkdir -p /var/www/gamelo/uploads/banners
mkdir -p /var/www/gamelo/uploads/products

# الصلاحيات
chmod -R 755 /var/www/gamelo/uploads
```

---

## الخطوة 7: رفع ملفات المشروع

### الخيار A: من GitHub

```bash
cd /var/www/gamelo
git clone https://github.com/اسم_المستخدم/اسم_المشروع.git .
```

### الخيار B: من Emergent مباشرة

1. في Emergent، اضغط **"Save to GitHub"**
2. انسخ الرابط
3. نفّذ:
```bash
cd /var/www/gamelo
git clone الرابط .
```

### الخيار C: باستخدام FileZilla (انظر الطريقة الثالثة)

---

## الخطوة 8: إعداد Backend

```bash
# الدخول للمجلد
cd /var/www/gamelo/backend

# إنشاء البيئة الافتراضية
python3 -m venv venv

# تفعيل البيئة
source venv/bin/activate

# ترقية pip
pip install --upgrade pip

# تثبيت المكتبات
pip install -r requirements.txt
```

### إنشاء ملف .env:

```bash
# إنشاء مفتاح JWT
python3 -c "import secrets; print(secrets.token_hex(32))"
# انسخ الناتج!

# إنشاء مفتاح التشفير
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# انسخ الناتج!

# إنشاء ملف .env
nano /var/www/gamelo/backend/.env
```

محتوى الملف:
```bash
MONGO_URL=mongodb://localhost:27017
DB_NAME=gamelo_production
JWT_SECRET=الصق_مفتاح_JWT_هنا
ENCRYPTION_KEY=الصق_مفتاح_التشفير_هنا
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

للحفظ: `Ctrl+X` → `Y` → `Enter`

```bash
# إلغاء تفعيل البيئة
deactivate
```

---

## الخطوة 9: إعداد Frontend

```bash
cd /var/www/gamelo/frontend

# إنشاء ملف .env
nano .env
```

المحتوى:
```bash
REACT_APP_BACKEND_URL=https://yourdomain.com/api
```

```bash
# تثبيت المكتبات
yarn install
# أو
npm install --legacy-peer-deps

# بناء المشروع (انتظر 2-5 دقائق)
yarn build
# أو
npm run build
```

---

## الخطوة 10: إعداد Nginx

```bash
nano /etc/nginx/sites-available/gamelo
```

المحتوى (غيّر `yourdomain.com`):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    root /var/www/gamelo/frontend/build;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads {
        alias /var/www/gamelo/uploads;
        expires 30d;
        add_header Access-Control-Allow-Origin *;
    }

    client_max_body_size 100M;
}
```

```bash
# تفعيل الموقع
ln -sf /etc/nginx/sites-available/gamelo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# اختبار الإعدادات
nginx -t

# إعادة تشغيل Nginx
systemctl reload nginx
```

---

## الخطوة 11: إنشاء خدمة Backend

```bash
nano /etc/systemd/system/gamelo.service
```

المحتوى:
```ini
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
```

```bash
# تفعيل وتشغيل
systemctl daemon-reload
systemctl enable gamelo
systemctl start gamelo

# التحقق
systemctl status gamelo
```

---

## الخطوة 12: شهادة SSL

```bash
# تثبيت Certbot
apt install -y certbot python3-certbot-nginx

# الحصول على الشهادة (غيّر الدومين)
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# اتبع التعليمات:
# - أدخل بريدك الإلكتروني
# - اكتب Y للموافقة
# - اختر 2 لإعادة التوجيه لـ HTTPS
```

---

## الخطوة 13: الجدار الناري

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

---

## الخطوة 14: إنشاء حساب المدير

```bash
cd /var/www/gamelo/backend
source venv/bin/activate

python3 << 'ADMINSCRIPT'
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
    
    # ===== غيّر هذه البيانات! =====
    admin_email = "admin@yourdomain.com"
    admin_password = "YourStrongPassword123!"
    # ==============================
    
    existing = await db.users.find_one({"email": admin_email})
    if existing:
        print(f"الحساب موجود: {admin_email}")
        return
    
    password_hash = bcrypt.hashpw(admin_password.encode(), bcrypt.gensalt()).decode()
    
    await db.users.insert_one({
        "id": str(uuid.uuid4()),
        "email": admin_email,
        "password_hash": password_hash,
        "name": "مدير النظام",
        "role": "admin",
        "role_level": 100,
        "is_active": True,
        "is_approved": True,
        "wallet_balance_jod": 0.0,
        "wallet_balance_usd": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    print(f"✅ تم إنشاء الحساب!")
    print(f"البريد: {admin_email}")
    print(f"كلمة المرور: {admin_password}")
a
asyncio.run(create_admin())
ADMINSCRIPT

deactivate
```

---

# 📂 الطريقة الثالثة: FileZilla + الأوامر

## المميزات:
- ✅ رفع الملفات بواجهة رسومية
- ✅ سهل للمبتدئين
- ✅ يمكن رؤية الملفات

## العيوب:
- ❌ يحتاج برنامج إضافي
- ❌ أبطأ من الطرق الأخرى

---

## الخطوة 1: تحميل FileZilla

1. اذهب إلى [filezilla-project.org](https://filezilla-project.org/download.php)
2. حمّل **FileZilla Client**
3. ثبّت البرنامج

---

## الخطوة 2: الاتصال بالخادم عبر FileZilla

1. افتح FileZilla
2. في الأعلى أدخل:
   - **Host**: `sftp://IP_الخادم`
   - **Username**: `root`
   - **Password**: كلمة مرور الخادم
   - **Port**: `22`
3. اضغط **Quickconnect**
4. إذا ظهرت رسالة تأكيد، اضغط **OK**

---

## الخطوة 3: تحميل المشروع من Emergent

### من Emergent:
1. اذهب للمشروع في Emergent
2. اضغط على أيقونة **Download** أو **Export**
3. حمّل ملفات `backend` و `frontend`

### أو من GitHub:
1. اذهب لمستودعك على GitHub
2. اضغط **Code** → **Download ZIP**
3. فك الضغط على جهازك

---

## الخطوة 4: رفع الملفات عبر FileZilla

### في FileZilla:
1. **الجانب الأيسر**: جهازك (اذهب لمجلد المشروع)
2. **الجانب الأيمن**: الخادم

### الرفع:
1. في الجانب الأيمن، اذهب إلى `/var/www/`
2. إذا لم يوجد مجلد `gamelo`:
   - كليك يمين → **Create directory** → اكتب `gamelo`
3. ادخل مجلد `/var/www/gamelo/`
4. من الجانب الأيسر، اسحب مجلد `backend` للجانب الأيمن
5. اسحب مجلد `frontend` للجانب الأيمن
6. انتظر اكتمال الرفع

---

## الخطوة 5: تثبيت البرامج على الخادم

الآن اتصل بالخادم عبر SSH وشغّل:

```bash
ssh root@IP_الخادم

# تحديث النظام
apt update && apt upgrade -y

# تثبيت Python
apt install -y python3 python3-pip python3-venv python3-dev build-essential

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g yarn

# تثبيت MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update && apt install -y mongodb-org
systemctl start mongod && systemctl enable mongod

# تثبيت Nginx
apt install -y nginx
systemctl start nginx && systemctl enable nginx
```

---

## الخطوة 6: إكمال الإعداد

اتبع الخطوات من 8 إلى 14 من **الطريقة اليدوية** أعلاه.

---

# 🔄 الطريقة الرابعة: GitHub Actions (CI/CD)

## المميزات:
- ✅ نشر تلقائي عند كل تحديث
- ✅ احترافي ومتقدم
- ✅ لا يحتاج تدخل يدوي

## العيوب:
- ❌ إعداد معقد
- ❌ يحتاج خبرة بـ GitHub Actions

---

## الخطوة 1: إعداد SSH Key

على الخادم:
```bash
# إنشاء مفتاح SSH
ssh-keygen -t ed25519 -C "github-actions" -f /root/.ssh/github_actions -N ""

# عرض المفتاح العام (أضفه للخادم)
cat /root/.ssh/github_actions.pub >> /root/.ssh/authorized_keys

# عرض المفتاح الخاص (انسخه)
cat /root/.ssh/github_actions
```

---

## الخطوة 2: إضافة Secrets في GitHub

1. اذهب لمستودعك على GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. أضف:
   - `SERVER_HOST`: IP الخادم
   - `SERVER_USER`: `root`
   - `SERVER_SSH_KEY`: المفتاح الخاص (من الخطوة السابقة)
   - `DOMAIN`: اسم دومينك

---

## الخطوة 3: إنشاء ملف Workflow

أنشئ ملف `.github/workflows/deploy.yml` في مشروعك:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v1.0.3
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SERVER_SSH_KEY }}
        script: |
          cd /var/www/gamelo
          git pull origin main
          
          # Backend
          cd backend
          source venv/bin/activate
          pip install -r requirements.txt
          deactivate
          systemctl restart gamelo
          
          # Frontend
          cd ../frontend
          yarn install
          yarn build
          
          # Reload Nginx
          nginx -s reload
          
          echo "✅ Deployment complete!"
```

---

## الخطوة 4: الاستخدام

بعد الإعداد، كل ما عليك:
1. اعمل تغييراتك محلياً
2. `git push origin main`
3. سيتم النشر تلقائياً!

---

# 🔧 حل المشاكل الشائعة

## المشكلة 1: الموقع لا يفتح (Connection Refused)

### الأسباب والحلول:

```bash
# 1. تحقق من Nginx
systemctl status nginx
# إذا متوقف:
systemctl start nginx

# 2. تحقق من Backend
systemctl status gamelo
# إذا متوقف:
systemctl start gamelo

# 3. تحقق من الجدار الناري
ufw status
# إذا المنافذ مغلقة:
ufw allow 80
ufw allow 443

# 4. تحقق من DNS
ping yourdomain.com
# إذا لم يظهر IP الخادم، انتظر أو راجع إعدادات DNS
```

---

## المشكلة 2: خطأ 502 Bad Gateway

```bash
# Backend متوقف أو يعطي خطأ

# 1. تحقق من الحالة
systemctl status gamelo

# 2. شاهد السجلات
journalctl -u gamelo --no-pager | tail -50

# 3. تحقق يدوياً
cd /var/www/gamelo/backend
source venv/bin/activate
python3 -c "import server"  # يجب ألا يظهر خطأ
uvicorn server:app --host 0.0.0.0 --port 8001

# 4. إذا ظهر خطأ في المكتبات
pip install -r requirements.txt
```

---

## المشكلة 3: خطأ 500 Internal Server Error

```bash
# خطأ في الكود أو الإعدادات

# 1. شاهد سجلات Backend
tail -f /var/log/gamelo/backend-error.log

# 2. أو
journalctl -u gamelo -f

# 3. تحقق من ملف .env
cat /var/www/gamelo/backend/.env

# 4. تحقق من اتصال MongoDB
mongosh
# يجب أن يتصل بدون أخطاء
```

---

## المشكلة 4: SSL لا يعمل

```bash
# 1. تأكد من توجيه DNS
dig yourdomain.com
# يجب أن يظهر IP الخادم

# 2. أعد محاولة الحصول على الشهادة
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 3. إذا استمر الخطأ
certbot certonly --standalone -d yourdomain.com
# ثم أعد تشغيل Nginx
systemctl restart nginx
```

---

## المشكلة 5: لا أستطيع رفع ملفات كبيرة

```bash
# 1. تعديل Nginx
nano /etc/nginx/sites-available/gamelo

# ابحث عن client_max_body_size وغيّرها إلى:
client_max_body_size 200M;

# 2. أعد تحميل Nginx
nginx -t
systemctl reload nginx
```

---

## المشكلة 6: MongoDB لا يعمل

```bash
# 1. تحقق من الحالة
systemctl status mongod

# 2. شاهد السجلات
cat /var/log/mongodb/mongod.log | tail -50

# 3. تحقق من المساحة
df -h
# إذا الـ disk ممتلئ، احذف ملفات غير ضرورية

# 4. أعد التشغيل
systemctl restart mongod
```

---

# 🔄 الصيانة والتحديث

## التحديث اليدوي

```bash
cd /var/www/gamelo

# جلب التحديثات
git pull

# تحديث Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
deactivate
systemctl restart gamelo

# تحديث Frontend
cd ../frontend
yarn install
yarn build

# إعادة تحميل Nginx
nginx -s reload
```

## النسخ الاحتياطي

```bash
# نسخ قاعدة البيانات
mongodump --db gamelo_production --out /backup/db_$(date +%Y%m%d)

# نسخ الملفات المرفوعة
cp -r /var/www/gamelo/uploads /backup/uploads_$(date +%Y%m%d)

# نسخ الإعدادات
cp /var/www/gamelo/backend/.env /backup/env_$(date +%Y%m%d)
```

## استعادة النسخة الاحتياطية

```bash
# استعادة قاعدة البيانات
mongorestore --db gamelo_production /backup/db_YYYYMMDD/gamelo_production

# استعادة الملفات
cp -r /backup/uploads_YYYYMMDD/* /var/www/gamelo/uploads/
```

## مراقبة الموارد

```bash
# استخدام الذاكرة والمعالج
htop

# استخدام القرص
df -h

# سجلات النظام
journalctl -f
```

---

# ✅ قائمة التحقق النهائية

قبل الإعلان عن الموقع، تأكد من:

- [ ] الموقع يفتح على https://yourdomain.com
- [ ] لوحة التحكم تعمل على /admin
- [ ] تسجيل الدخول يعمل
- [ ] إضافة منتجات تعمل
- [ ] رفع الصور يعمل
- [ ] الشراء والدفع يعمل
- [ ] SSL مفعّل (القفل الأخضر)
- [ ] الجدار الناري مفعّل
- [ ] النسخ الاحتياطي مُعَد

---

**📅 آخر تحديث**: يناير 2025
**✍️ تم إنشاء هذا الدليل بواسطة**: Gamelo Team
