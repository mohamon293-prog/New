#!/bin/bash
###########################################
# Gamelo - Complete Installation Script
# For Ubuntu 22.04 VPS (Hostinger KVM)
# Updated: January 2026
###########################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
info() { echo -e "${BLUE}[i]${NC} $1"; }

# Configuration
DOMAIN="${1:-gamelo.org}"
SERVER_IP="${2:-$(curl -s ifconfig.me)}"
REPO_URL="https://github.com/mohamon293-prog/New.git"
APP_DIR="/var/www/gamelo"
DB_NAME="gamelo_db"

echo ""
echo "==========================================="
echo "       Gamelo Installation Script"
echo "==========================================="
echo ""
info "Domain: $DOMAIN"
info "Server IP: $SERVER_IP"
echo ""

###########################################
# 1. System Update & Dependencies
###########################################
log "Updating system packages..."
apt update && apt upgrade -y

log "Installing essential packages..."
apt install -y curl wget git nginx python3 python3-pip python3-venv supervisor certbot python3-certbot-nginx gnupg

###########################################
# 2. Node.js Installation (for frontend build)
###########################################
if ! command -v node &> /dev/null; then
    log "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
node --version

# Install yarn
npm install -g yarn

###########################################
# 3. MongoDB Installation
###########################################
if ! command -v mongod &> /dev/null; then
    log "Installing MongoDB 7.0..."
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt update
    apt install -y mongodb-org
    systemctl enable mongod
    systemctl start mongod
    sleep 3
else
    log "MongoDB already installed"
fi

mongod --version || error "MongoDB installation failed"
log "MongoDB is running"

###########################################
# 4. Clone Repository
###########################################
log "Setting up application directory..."
rm -rf $APP_DIR
mkdir -p $APP_DIR
cd $APP_DIR

log "Cloning repository..."
git clone $REPO_URL .
git config --global --add safe.directory $APP_DIR

###########################################
# 5. Backend Setup
###########################################
log "Setting up Python backend..."
cd $APP_DIR/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=$DB_NAME
JWT_SECRET=$(openssl rand -hex 32)
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
CORS_ORIGINS=*
ENCRYPTION_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
RESEND_API_KEY=
SENDER_EMAIL=onboarding@resend.dev
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
EOF

log "Backend configured"

###########################################
# 6. Frontend Setup & Build
###########################################
log "Setting up frontend..."
cd $APP_DIR/frontend

# Create .env file
cat > .env << EOF
VITE_API_URL=https://$DOMAIN
EOF

# Install dependencies and build
yarn install
yarn build

log "Frontend built successfully"

###########################################
# 7. Create directories
###########################################
mkdir -p $APP_DIR/backend/uploads/images
chown -R www-data:www-data $APP_DIR

###########################################
# 8. Supervisor Configuration
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
supervisorctl restart gamelo-backend
log "Backend service configured"

###########################################
# 9. Nginx Configuration
###########################################
log "Configuring Nginx..."
cat > /etc/nginx/sites-available/gamelo << 'NGINX_EOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER SERVER_IP_PLACEHOLDER _;
    
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
NGINX_EOF

# Replace placeholders
sed -i "s|DOMAIN_PLACEHOLDER|$DOMAIN|g" /etc/nginx/sites-available/gamelo
sed -i "s|SERVER_IP_PLACEHOLDER|$SERVER_IP|g" /etc/nginx/sites-available/gamelo
sed -i "s|APP_DIR_PLACEHOLDER|$APP_DIR|g" /etc/nginx/sites-available/gamelo

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/gamelo /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
log "Nginx configured"

###########################################
# 10. Initialize Database
###########################################
log "Initializing database..."

# Create admin user
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
print("Admin user created");
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
print("Categories created");
'

# Create sample products
mongosh $DB_NAME --eval '
db.products.deleteMany({});
db.products.insertMany([
  {
    "id": "ps-store-10",
    "name": "بطاقة بلايستيشن ستور $10",
    "name_en": "PlayStation Store $10",
    "slug": "ps-store-10",
    "description": "بطاقة رصيد بلايستيشن ستور بقيمة 10 دولار أمريكي",
    "category_id": "playstation",
    "price_jod": 7.99,
    "price_usd": 10.0,
    "image_url": "https://placehold.co/400x400/003087/ffffff?text=PS+$10",
    "platform": "playstation",
    "region": "US",
    "is_active": true,
    "is_featured": true,
    "product_type": "digital_code",
    "has_variants": false,
    "rating": 4.8,
    "review_count": 120,
    "sold_count": 500,
    "stock_count": 10,
    "created_at": new Date().toISOString(),
    "updated_at": new Date().toISOString()
  },
  {
    "id": "ps-store-25",
    "name": "بطاقة بلايستيشن ستور $25",
    "name_en": "PlayStation Store $25",
    "slug": "ps-store-25",
    "description": "بطاقة رصيد بلايستيشن ستور بقيمة 25 دولار أمريكي",
    "category_id": "playstation",
    "price_jod": 19.5,
    "price_usd": 25.0,
    "image_url": "https://placehold.co/400x400/003087/ffffff?text=PS+$25",
    "platform": "playstation",
    "region": "US",
    "is_active": true,
    "is_featured": true,
    "product_type": "digital_code",
    "has_variants": false,
    "rating": 4.9,
    "review_count": 200,
    "sold_count": 800,
    "stock_count": 15,
    "created_at": new Date().toISOString(),
    "updated_at": new Date().toISOString()
  },
  {
    "id": "xbox-10",
    "name": "بطاقة Xbox $10",
    "name_en": "Xbox Gift Card $10",
    "slug": "xbox-10",
    "description": "بطاقة رصيد Xbox بقيمة 10 دولار",
    "category_id": "xbox",
    "price_jod": 7.99,
    "price_usd": 10.0,
    "image_url": "https://placehold.co/400x400/107c10/ffffff?text=Xbox+$10",
    "platform": "xbox",
    "region": "US",
    "is_active": true,
    "is_featured": true,
    "product_type": "digital_code",
    "has_variants": false,
    "rating": 4.7,
    "review_count": 90,
    "sold_count": 400,
    "stock_count": 12,
    "created_at": new Date().toISOString(),
    "updated_at": new Date().toISOString()
  },
  {
    "id": "steam-20",
    "name": "بطاقة ستيم $20",
    "name_en": "Steam Wallet $20",
    "slug": "steam-20",
    "description": "بطاقة رصيد ستيم بقيمة 20 دولار",
    "category_id": "steam",
    "price_jod": 15.5,
    "price_usd": 20.0,
    "image_url": "https://placehold.co/400x400/1b2838/ffffff?text=Steam+$20",
    "platform": "steam",
    "region": "عالمي",
    "is_active": true,
    "is_featured": true,
    "product_type": "digital_code",
    "has_variants": false,
    "rating": 4.8,
    "review_count": 150,
    "sold_count": 600,
    "stock_count": 20,
    "created_at": new Date().toISOString(),
    "updated_at": new Date().toISOString()
  },
  {
    "id": "pubg-660uc",
    "name": "PUBG Mobile 660 UC",
    "name_en": "PUBG Mobile 660 UC",
    "slug": "pubg-660uc",
    "description": "شحن 660 UC لعبة PUBG Mobile",
    "category_id": "mobile",
    "price_jod": 7.99,
    "price_usd": 10.99,
    "image_url": "https://placehold.co/400x400/f2a900/000000?text=PUBG+660UC",
    "platform": "mobile",
    "region": "عالمي",
    "is_active": true,
    "is_featured": true,
    "product_type": "digital_code",
    "has_variants": false,
    "rating": 4.5,
    "review_count": 300,
    "sold_count": 1500,
    "stock_count": 50,
    "created_at": new Date().toISOString(),
    "updated_at": new Date().toISOString()
  },
  {
    "id": "itunes-25",
    "name": "بطاقة آيتونز $25",
    "name_en": "iTunes Gift Card $25",
    "slug": "itunes-25",
    "description": "بطاقة هدايا آيتونز بقيمة 25 دولار",
    "category_id": "giftcards",
    "price_jod": 18.99,
    "price_usd": 25.0,
    "image_url": "https://placehold.co/400x400/fb5bc5/ffffff?text=iTunes+$25",
    "platform": "giftcards",
    "region": "US",
    "is_active": true,
    "is_featured": true,
    "product_type": "digital_code",
    "has_variants": false,
    "rating": 4.8,
    "review_count": 100,
    "sold_count": 450,
    "stock_count": 25,
    "created_at": new Date().toISOString(),
    "updated_at": new Date().toISOString()
  }
]);
print("Sample products created");
'

# Create indexes
mongosh $DB_NAME --eval '
db.users.createIndex({email: 1}, {unique: true});
db.users.createIndex({id: 1}, {unique: true});
db.products.createIndex({id: 1}, {unique: true});
db.products.createIndex({slug: 1}, {unique: true});
db.products.createIndex({category_id: 1});
db.categories.createIndex({id: 1}, {unique: true});
db.orders.createIndex({id: 1}, {unique: true});
db.orders.createIndex({user_id: 1});
db.codes.createIndex({product_id: 1, is_sold: 1});
db.affiliates.createIndex({id: 1}, {unique: true});
db.affiliates.createIndex({email: 1}, {unique: true});
db.discount_codes.createIndex({code: 1}, {unique: true});
db.discount_usage.createIndex({discount_id: 1});
print("Indexes created");
'

log "Database initialized"

###########################################
# 11. Final Permissions
###########################################
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

###########################################
# 12. Verify Installation
###########################################
log "Verifying installation..."
sleep 3

# Test backend
HEALTH=$(curl -s http://localhost:8001/api/health 2>/dev/null || echo "failed")
if [[ "$HEALTH" == *"healthy"* ]]; then
    log "Backend API: OK"
else
    warn "Backend API: Check logs with 'tail -50 /var/log/supervisor/gamelo-backend.err.log'"
fi

# Test nginx
if curl -s http://localhost/ | grep -q "Gamelo"; then
    log "Frontend: OK"
else
    warn "Frontend: Check nginx logs"
fi

echo ""
echo "==========================================="
echo -e "${GREEN}     Installation Complete!${NC}"
echo "==========================================="
echo ""
echo "Access your site at:"
echo "  - http://$SERVER_IP"
echo "  - http://$DOMAIN (after DNS setup)"
echo ""
echo "Admin Login:"
echo "  - Email: admin@gamelo.com"
echo "  - Password: admin123"
echo ""
echo "Features included:"
echo "  ✓ User authentication with JWT"
echo "  ✓ Email verification & Password reset (needs Resend API key)"
echo "  ✓ Product management (digital codes, accounts)"
echo "  ✓ Order management with wallet payment"
echo "  ✓ Affiliate/Marketer system with commissions"
echo "  ✓ Product-specific coupons"
echo "  ✓ Analytics dashboard"
echo "  ✓ Role-based access control (RBAC)"
echo ""
echo "Useful commands:"
echo "  - View backend logs: tail -f /var/log/supervisor/gamelo-backend.err.log"
echo "  - Restart backend: supervisorctl restart gamelo-backend"
echo "  - Restart nginx: systemctl restart nginx"
echo ""
echo "To enable HTTPS (after DNS is configured):"
echo "  certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "To configure email (for password reset):"
echo "  1. Sign up at https://resend.com"
echo "  2. Add your API key to $APP_DIR/backend/.env"
echo "  3. Restart backend: supervisorctl restart gamelo-backend"
echo ""
