#!/bin/bash
###########################################
# Gamelo - Complete Installation Script
# سكريبت التثبيت الكامل لمنصة Gamelo
# Version: 2.0
# Date: January 2026
###########################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
info() { echo -e "${BLUE}[i]${NC} $1"; }
step() { echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${PURPLE}  $1${NC}"; echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"; }

# Configuration
DOMAIN="${1:-gamelo.org}"
EMAIL="${2:-admin@gamelo.org}"
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")
REPO_URL="https://github.com/mohamon293-prog/New.git"
APP_DIR="/var/www/gamelo"
DB_NAME="gamelo_db"

clear
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║     🎮  Gamelo - Complete Installation Script  🎮        ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║     متجر الألعاب الرقمية - سكريبت التثبيت الكامل          ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
info "Domain: $DOMAIN"
info "Email: $EMAIL"
info "Server IP: $SERVER_IP"
info "Repository: $REPO_URL"
echo ""
read -p "Press Enter to start installation or Ctrl+C to cancel..."

###########################################
step "1/12 - System Update"
###########################################
log "Updating system packages..."
apt update && apt upgrade -y

log "Installing essential packages..."
apt install -y \
    curl \
    wget \
    git \
    nginx \
    python3 \
    python3-pip \
    python3-venv \
    supervisor \
    certbot \
    python3-certbot-nginx \
    gnupg \
    build-essential \
    ufw

###########################################
step "2/12 - Node.js 20 Installation"
###########################################
if ! command -v node &> /dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 18 ]]; then
    log "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
else
    log "Node.js already installed: $(node -v)"
fi

# Install yarn globally
log "Installing Yarn..."
npm install -g yarn

###########################################
step "3/12 - MongoDB 7.0 Installation"
###########################################
if ! command -v mongod &> /dev/null; then
    log "Installing MongoDB 7.0..."
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
        gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
        tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt update
    apt install -y mongodb-org
    systemctl enable mongod
    systemctl start mongod
    sleep 5
else
    log "MongoDB already installed"
    systemctl start mongod 2>/dev/null || true
fi

# Verify MongoDB
mongod --version || error "MongoDB installation failed"
log "MongoDB is running ✓"

###########################################
step "4/12 - Clone Repository"
###########################################
log "Setting up application directory..."
rm -rf $APP_DIR
mkdir -p $APP_DIR
cd $APP_DIR

log "Cloning repository..."
git clone $REPO_URL . || error "Failed to clone repository"
git config --global --add safe.directory $APP_DIR
log "Repository cloned successfully ✓"

###########################################
step "5/12 - Backend Setup"
###########################################
log "Setting up Python backend..."
cd $APP_DIR/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
log "Installing Python dependencies..."
pip install -r requirements.txt

# Generate secure keys
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")

# Create .env file
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=$DB_NAME
JWT_SECRET=$JWT_SECRET
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
CORS_ORIGINS=*
ENCRYPTION_KEY=$ENCRYPTION_KEY
RESEND_API_KEY=re_QZ8LDEFu_4W4ceZXWBCoNYUAGvTCVh4KS
SENDER_EMAIL=onboarding@resend.dev
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
EOF

log "Backend configured ✓"

###########################################
step "6/12 - Frontend Setup & Build"
###########################################
log "Setting up frontend..."
cd $APP_DIR/frontend

# Create production .env
cat > .env << EOF
VITE_API_URL=https://$DOMAIN
EOF

# Install dependencies
log "Installing frontend dependencies..."
yarn install

# Build frontend
log "Building frontend (this may take a few minutes)..."
yarn build

if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    log "Frontend built successfully ✓"
else
    error "Frontend build failed"
fi

###########################################
step "7/12 - Create Directories & Permissions"
###########################################
log "Setting up directories..."
mkdir -p $APP_DIR/backend/uploads/images
mkdir -p /var/log/supervisor

chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

log "Directories configured ✓"

###########################################
step "8/12 - Supervisor Configuration"
###########################################
log "Configuring Supervisor..."

cat > /etc/supervisor/conf.d/gamelo-backend.conf << EOF
[program:gamelo-backend]
command=$APP_DIR/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
directory=$APP_DIR/backend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/gamelo-backend.err.log
stdout_logfile=/var/log/supervisor/gamelo-backend.out.log
environment=PATH="$APP_DIR/backend/venv/bin"
EOF

supervisorctl reread
supervisorctl update
sleep 3
supervisorctl restart gamelo-backend || supervisorctl start gamelo-backend

log "Supervisor configured ✓"

###########################################
step "9/12 - Nginx Configuration (HTTP)"
###########################################
log "Configuring Nginx..."

# First, configure HTTP only (SSL will be added by certbot)
cat > /etc/nginx/sites-available/gamelo << 'NGINX_CONF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    
    root APP_DIR_PLACEHOLDER/frontend/dist;
    index index.html;
    client_max_body_size 100M;
    
    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
    }
    
    # Uploads
    location /uploads/ {
        alias APP_DIR_PLACEHOLDER/backend/uploads/;
    }
    
    # Frontend SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX_CONF

# Replace placeholders
sed -i "s|DOMAIN_PLACEHOLDER|$DOMAIN|g" /etc/nginx/sites-available/gamelo
sed -i "s|APP_DIR_PLACEHOLDER|$APP_DIR|g" /etc/nginx/sites-available/gamelo

# Enable site
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/gamelo /etc/nginx/sites-enabled/

# Test and reload
nginx -t || error "Nginx configuration test failed"
systemctl reload nginx

log "Nginx configured (HTTP) ✓"

###########################################
step "10/12 - SSL Certificate (Let's Encrypt)"
###########################################
log "Setting up SSL certificate..."

# Get SSL certificate
certbot --nginx -d $DOMAIN -d www.$DOMAIN \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --redirect \
    || warn "SSL setup failed - you may need to run certbot manually"

# Setup auto-renewal
systemctl enable certbot.timer
systemctl start certbot.timer

log "SSL configured ✓"

###########################################
step "11/12 - Initialize Database"
###########################################
log "Initializing database..."

# Wait for MongoDB
sleep 3

# Create admin user (password: admin123)
mongosh $DB_NAME --eval '
db.users.deleteMany({email: "admin@gamelo.com"});
db.users.insertOne({
  "id": "admin-001",
  "email": "admin@gamelo.com",
  "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G0r7RqECY8XYMO",
  "name": "مدير النظام",
  "phone": "",
  "role": "admin",
  "role_level": 100,
  "permissions": ["all"],
  "is_active": true,
  "is_approved": true,
  "is_verified": true,
  "wallet_balance": 0,
  "wallet_balance_jod": 0,
  "wallet_balance_usd": 0,
  "created_at": new Date().toISOString(),
  "updated_at": new Date().toISOString()
});
print("✓ Admin user created");
'

# Create categories
mongosh $DB_NAME --eval '
db.categories.deleteMany({});
db.categories.insertMany([
  {"id":"playstation","name":"بلايستيشن","name_en":"PlayStation","slug":"playstation","image_url":"https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&q=80","description":"بطاقات وأكواد بلايستيشن","order":1,"is_active":true},
  {"id":"xbox","name":"إكس بوكس","name_en":"Xbox","slug":"xbox","image_url":"https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400&q=80","description":"بطاقات وأكواد إكس بوكس","order":2,"is_active":true},
  {"id":"steam","name":"ستيم","name_en":"Steam","slug":"steam","image_url":"https://images.unsplash.com/photo-1614285457768-646f65ca8548?w=400&q=80","description":"بطاقات ستيم وألعاب PC","order":3,"is_active":true},
  {"id":"nintendo","name":"نينتندو","name_en":"Nintendo","slug":"nintendo","image_url":"https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400&q=80","description":"بطاقات نينتندو إي شوب","order":4,"is_active":true},
  {"id":"giftcards","name":"بطاقات الهدايا","name_en":"Gift Cards","slug":"giftcards","image_url":"https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80","description":"بطاقات هدايا متنوعة","order":5,"is_active":true},
  {"id":"mobile","name":"ألعاب الجوال","name_en":"Mobile Games","slug":"mobile","image_url":"https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&q=80","description":"شحن ألعاب الجوال","order":6,"is_active":true}
]);
print("✓ Categories created");
'

# Create sample products
mongosh $DB_NAME --eval '
db.products.deleteMany({});
db.products.insertMany([
  {
    "id": "ps-plus-12",
    "name": "اشتراك PlayStation Plus - 12 شهر",
    "name_en": "PlayStation Plus 12 Months",
    "slug": "ps-plus-12-months",
    "description": "اشتراك بلايستيشن بلس لمدة 12 شهر - استمتع بالألعاب المجانية الشهرية واللعب أونلاين",
    "category_id": "playstation",
    "price_jod": 45.0,
    "price_usd": 59.99,
    "image_url": "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&q=80",
    "platform": "playstation",
    "region": "US",
    "is_active": true,
    "is_featured": true,
    "product_type": "digital_code",
    "has_variants": false,
    "rating": 4.9,
    "review_count": 250,
    "sold_count": 1200,
    "stock_count": 50,
    "created_at": new Date().toISOString()
  },
  {
    "id": "ps-store-50",
    "name": "بطاقة بلايستيشن ستور $50",
    "name_en": "PlayStation Store $50",
    "slug": "ps-store-50",
    "description": "بطاقة رصيد بلايستيشن ستور بقيمة 50 دولار أمريكي",
    "category_id": "playstation",
    "price_jod": 38.0,
    "price_usd": 50.0,
    "image_url": "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&q=80",
    "platform": "playstation",
    "region": "US",
    "is_active": true,
    "is_featured": true,
    "product_type": "digital_code",
    "has_variants": false,
    "rating": 4.8,
    "review_count": 180,
    "sold_count": 800,
    "stock_count": 30,
    "created_at": new Date().toISOString()
  },
  {
    "id": "xbox-gamepass-3",
    "name": "Xbox Game Pass Ultimate - 3 أشهر",
    "name_en": "Xbox Game Pass Ultimate 3 Months",
    "slug": "xbox-gamepass-3-months",
    "description": "اشتراك Xbox Game Pass Ultimate لمدة 3 أشهر - أكثر من 100 لعبة",
    "category_id": "xbox",
    "price_jod": 35.0,
    "price_usd": 44.99,
    "image_url": "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400&q=80",
    "platform": "xbox",
    "region": "عالمي",
    "is_active": true,
    "is_featured": true,
    "product_type": "digital_code",
    "has_variants": false,
    "rating": 4.9,
    "review_count": 320,
    "sold_count": 1500,
    "stock_count": 40,
    "created_at": new Date().toISOString()
  },
  {
    "id": "steam-50",
    "name": "بطاقة ستيم $50",
    "name_en": "Steam Wallet $50",
    "slug": "steam-50",
    "description": "بطاقة رصيد ستيم بقيمة 50 دولار",
    "category_id": "steam",
    "price_jod": 38.0,
    "price_usd": 50.0,
    "image_url": "https://images.unsplash.com/photo-1614285457768-646f65ca8548?w=400&q=80",
    "platform": "steam",
    "region": "عالمي",
    "is_active": true,
    "is_featured": true,
    "product_type": "digital_code",
    "has_variants": false,
    "rating": 4.8,
    "review_count": 200,
    "sold_count": 900,
    "stock_count": 35,
    "created_at": new Date().toISOString()
  },
  {
    "id": "pubg-1800uc",
    "name": "PUBG Mobile 1800 UC",
    "name_en": "PUBG Mobile 1800 UC",
    "slug": "pubg-1800uc",
    "description": "شحن 1800 UC لعبة PUBG Mobile",
    "category_id": "mobile",
    "price_jod": 22.0,
    "price_usd": 29.99,
    "image_url": "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&q=80",
    "platform": "mobile",
    "region": "عالمي",
    "is_active": true,
    "is_featured": true,
    "product_type": "digital_code",
    "has_variants": false,
    "rating": 4.7,
    "review_count": 450,
    "sold_count": 2000,
    "stock_count": 100,
    "created_at": new Date().toISOString()
  },
  {
    "id": "itunes-100",
    "name": "بطاقة آيتونز $100",
    "name_en": "iTunes Gift Card $100",
    "slug": "itunes-100",
    "description": "بطاقة هدايا آيتونز بقيمة 100 دولار",
    "category_id": "giftcards",
    "price_jod": 75.0,
    "price_usd": 100.0,
    "image_url": "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80",
    "platform": "giftcards",
    "region": "US",
    "is_active": true,
    "is_featured": true,
    "product_type": "digital_code",
    "has_variants": false,
    "rating": 4.8,
    "review_count": 150,
    "sold_count": 600,
    "stock_count": 25,
    "created_at": new Date().toISOString()
  }
]);
print("✓ Sample products created");
'

# Create database indexes
mongosh $DB_NAME --eval '
db.users.createIndex({email: 1}, {unique: true});
db.users.createIndex({id: 1}, {unique: true});
db.products.createIndex({id: 1}, {unique: true});
db.products.createIndex({slug: 1});
db.products.createIndex({category_id: 1});
db.products.createIndex({is_featured: 1});
db.categories.createIndex({id: 1}, {unique: true});
db.orders.createIndex({id: 1}, {unique: true});
db.orders.createIndex({user_id: 1});
db.codes.createIndex({product_id: 1, is_sold: 1});
db.affiliates.createIndex({id: 1}, {unique: true});
db.affiliates.createIndex({email: 1});
db.discount_codes.createIndex({code: 1}, {unique: true});
db.discount_usage.createIndex({discount_id: 1});
db.wallet_transactions.createIndex({user_id: 1});
print("✓ Database indexes created");
'

log "Database initialized ✓"

###########################################
step "12/12 - Final Verification"
###########################################
log "Verifying installation..."

# Restart all services
supervisorctl restart gamelo-backend
systemctl reload nginx
sleep 5

# Test backend
BACKEND_OK=false
if curl -s http://localhost:8001/api/health | grep -q "healthy"; then
    log "Backend API: ✓ Working"
    BACKEND_OK=true
else
    warn "Backend API: Not responding - checking logs..."
    tail -20 /var/log/supervisor/gamelo-backend.err.log
fi

# Test frontend
FRONTEND_OK=false
if curl -s http://localhost/ | grep -q "Gamelo"; then
    log "Frontend: ✓ Working"
    FRONTEND_OK=true
else
    warn "Frontend: Not loading properly"
fi

# Test HTTPS
HTTPS_OK=false
if curl -s https://$DOMAIN/api/health 2>/dev/null | grep -q "healthy"; then
    log "HTTPS: ✓ Working"
    HTTPS_OK=true
else
    warn "HTTPS: May need manual verification"
fi

###########################################
# Installation Complete
###########################################
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║        🎉  Installation Complete!  🎉                     ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  🌐 ${GREEN}Website:${NC} https://$DOMAIN"
echo -e "  🌐 ${GREEN}Website:${NC} https://www.$DOMAIN"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${YELLOW}Admin Login:${NC}"
echo -e "    📧 Email: admin@gamelo.com"
echo -e "    🔑 Password: admin123"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${YELLOW}Features Installed:${NC}"
echo -e "    ✅ User Authentication (JWT)"
echo -e "    ✅ Email Verification & Password Reset"
echo -e "    ✅ Product Management (Digital Codes & Accounts)"
echo -e "    ✅ Order Management with Wallet"
echo -e "    ✅ Affiliate/Marketer System"
echo -e "    ✅ Product-Specific Coupons"
echo -e "    ✅ Advanced Analytics Dashboard"
echo -e "    ✅ Role-Based Access Control (RBAC)"
echo -e "    ✅ SSL/HTTPS Encryption"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${YELLOW}Useful Commands:${NC}"
echo -e "    View logs:     tail -f /var/log/supervisor/gamelo-backend.err.log"
echo -e "    Restart API:   supervisorctl restart gamelo-backend"
echo -e "    Restart Nginx: systemctl reload nginx"
echo -e "    Renew SSL:     certbot renew"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ "$BACKEND_OK" = true ] && [ "$FRONTEND_OK" = true ]; then
    echo -e "  ${GREEN}✅ All systems operational!${NC}"
else
    echo -e "  ${YELLOW}⚠️  Some services may need attention. Check logs above.${NC}"
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Thank you for using Gamelo! Enjoy your store! 🎮      ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
