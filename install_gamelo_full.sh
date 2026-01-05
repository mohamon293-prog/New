#!/bin/bash
#═══════════════════════════════════════════════════════════════════════════════
#  🎮 سكربت تثبيت Gamelo الكامل
#  الدومين: gamelo.org
#  تم إنشاؤه خصيصاً لـ: mohamon293-prog
#═══════════════════════════════════════════════════════════════════════════════

set -e

DOMAIN="gamelo.org"
EMAIL="mohamon291@gmail.com"
REPO="https://github.com/mohamon293-prog/New.git"

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           🎮 بدء تثبيت Gamelo على الخادم                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📋 المعلومات:"
echo "   الدومين: $DOMAIN"
echo "   البريد: $EMAIL"
echo "   المشروع: $REPO"
echo ""

sleep 2

#═══════════════════════════════════════════════════════════════════════════════
# تحديث النظام
#═══════════════════════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 [1/11] تحديث النظام..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y curl wget git nano ufw gnupg software-properties-common build-essential ca-certificates lsb-release

#═══════════════════════════════════════════════════════════════════════════════
# تثبيت Python
#═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐍 [2/11] تثبيت Python..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
apt-get install -y python3 python3-pip python3-venv python3-dev
python3 --version

#═══════════════════════════════════════════════════════════════════════════════
# تثبيت Node.js
#═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📗 [3/11] تثبيت Node.js 20..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g yarn
node --version
npm --version

#═══════════════════════════════════════════════════════════════════════════════
# تثبيت MongoDB
#═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🍃 [4/11] تثبيت MongoDB 7..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt-get update -y
apt-get install -y mongodb-org
systemctl start mongod
systemctl enable mongod
sleep 3
systemctl status mongod --no-pager || true

#═══════════════════════════════════════════════════════════════════════════════
# تثبيت Nginx
#═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 [5/11] تثبيت Nginx..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
apt-get install -y nginx certbot python3-certbot-nginx
systemctl start nginx
systemctl enable nginx

#═══════════════════════════════════════════════════════════════════════════════
# تحميل المشروع
#═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📥 [6/11] تحميل المشروع من GitHub..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
rm -rf /var/www/gamelo
mkdir -p /var/www/gamelo
cd /var/www/gamelo
git clone $REPO .
mkdir -p uploads/{images,banners,products}
chmod -R 755 uploads
ls -la

#═══════════════════════════════════════════════════════════════════════════════
# إعداد Backend
#═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚙️ [7/11] إعداد Backend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd /var/www/gamelo/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip wheel setuptools
pip install -r requirements.txt

# إنشاء مفاتيح التشفير
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
ENCRYPTION_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")

# إنشاء ملف .env
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=gamelo_production
JWT_SECRET=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
CORS_ORIGINS=https://${DOMAIN},https://www.${DOMAIN},http://${DOMAIN},http://www.${DOMAIN}
EOF

echo "✅ تم إنشاء .env"
deactivate

#═══════════════════════════════════════════════════════════════════════════════
# إعداد Frontend
#═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚛️ [8/11] إعداد Frontend (قد يستغرق 5-10 دقائق)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd /var/www/gamelo/frontend
echo "REACT_APP_BACKEND_URL=https://${DOMAIN}/api" > .env
yarn install --network-timeout 600000 || npm install --legacy-peer-deps
export NODE_OPTIONS="--max-old-space-size=4096"
yarn build || npm run build
echo "✅ تم بناء Frontend"

#═══════════════════════════════════════════════════════════════════════════════
# إعداد Nginx
#═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 [9/11] إعداد Nginx..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat > /etc/nginx/sites-available/gamelo << EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    root /var/www/gamelo/frontend/build;
    index index.html;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;

    # Frontend
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

    # Uploaded Files
    location /uploads {
        alias /var/www/gamelo/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin *;
    }

    client_max_body_size 100M;
}
EOF

ln -sf /etc/nginx/sites-available/gamelo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
echo "✅ تم إعداد Nginx"

#═══════════════════════════════════════════════════════════════════════════════
# إنشاء خدمة Backend
#═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 [10/11] إنشاء خدمة Backend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
mkdir -p /var/log/gamelo

cat > /etc/systemd/system/gamelo.service << EOF
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
EOF

systemctl daemon-reload
systemctl enable gamelo
systemctl start gamelo
sleep 3
systemctl status gamelo --no-pager || true

#═══════════════════════════════════════════════════════════════════════════════
# SSL + Firewall + Admin
#═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔒 [11/11] SSL والجدار الناري وحساب المدير..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable
ufw status

# SSL
echo ""
echo "🔐 جاري الحصول على شهادة SSL..."
certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos -m ${EMAIL} --redirect 2>/dev/null || {
    echo ""
    echo "⚠️ فشل SSL تلقائياً - شغّله يدوياً لاحقاً:"
    echo "   certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
}

# إنشاء حساب المدير
ADMIN_PASSWORD=$(python3 -c "import secrets,string; print(''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12)))")
ADMIN_EMAIL="admin@${DOMAIN}"

cd /var/www/gamelo/backend
source venv/bin/activate

python3 << ADMINSCRIPT
import asyncio
import bcrypt
import uuid
import os
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def create_admin():
    try:
        client = AsyncIOMotorClient(os.environ['MONGO_URL'])
        db = client[os.environ['DB_NAME']]
        
        admin_email = "${ADMIN_EMAIL}"
        admin_password = "${ADMIN_PASSWORD}"
        
        # حذف الحساب القديم إذا وجد
        await db.users.delete_one({"email": admin_email})
        
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
            "wallet_balance_jod": 1000.0,
            "wallet_balance_usd": 500.0,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        print("✅ تم إنشاء حساب المدير")
    except Exception as e:
        print(f"خطأ: {e}")

asyncio.run(create_admin())
ADMINSCRIPT

deactivate

#═══════════════════════════════════════════════════════════════════════════════
# حفظ البيانات
#═══════════════════════════════════════════════════════════════════════════════
cat > /root/gamelo_credentials.txt << EOF
╔═══════════════════════════════════════════════════════════════════╗
║                    معلومات Gamelo                                ║
║                    $(date)                                       ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  🌐 الموقع:          https://${DOMAIN}                           ║
║  🔧 لوحة التحكم:     https://${DOMAIN}/admin                     ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  📧 البريد:          ${ADMIN_EMAIL}                              ║
║  🔑 كلمة المرور:     ${ADMIN_PASSWORD}                           ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  📁 المسارات:                                                     ║
║     /var/www/gamelo/backend                                       ║
║     /var/www/gamelo/frontend                                      ║
║     /var/www/gamelo/uploads                                       ║
║     /var/log/gamelo/                                              ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  🛠️ أوامر مفيدة:                                                  ║
║     systemctl restart gamelo    - إعادة تشغيل Backend            ║
║     systemctl restart nginx     - إعادة تشغيل Nginx              ║
║     journalctl -u gamelo -f     - عرض سجلات Backend              ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
EOF

chmod 600 /root/gamelo_credentials.txt

# سكربت التحديث
cat > /root/update_gamelo.sh << 'UPDATEEOF'
#!/bin/bash
echo "🔄 تحديث Gamelo..."
cd /var/www/gamelo
git pull origin main
cd backend
source venv/bin/activate
pip install -r requirements.txt
deactivate
systemctl restart gamelo
cd ../frontend
yarn install
yarn build
nginx -s reload
echo "✅ تم التحديث!"
UPDATEEOF
chmod +x /root/update_gamelo.sh

#═══════════════════════════════════════════════════════════════════════════════
# النتيجة النهائية
#═══════════════════════════════════════════════════════════════════════════════
clear
echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                                                                   ║"
echo "║            🎉  تم تثبيت Gamelo بنجاح!  🎉                        ║"
echo "║                                                                   ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  📌 معلومات الموقع"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "  🌐 الموقع:          https://${DOMAIN}"
echo "  🔧 لوحة التحكم:     https://${DOMAIN}/admin"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  🔐 بيانات تسجيل الدخول"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "  📧 البريد:          ${ADMIN_EMAIL}"
echo "  🔑 كلمة المرور:     ${ADMIN_PASSWORD}"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "  ⚠️  مهم جداً: احفظ كلمة المرور في مكان آمن!"
echo ""
echo "  📄 البيانات محفوظة في: /root/gamelo_credentials.txt"
echo "  🔄 للتحديث لاحقاً:    bash /root/update_gamelo.sh"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""
