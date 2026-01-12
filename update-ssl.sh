#!/bin/bash
###########################################
# Gamelo - Update & SSL Script
# Run this on your server to update and enable SSL
###########################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

DOMAIN="gamelo.org"
APP_DIR="/var/www/gamelo"

echo ""
echo "==========================================="
echo "       Gamelo Update & SSL Script"
echo "==========================================="
echo ""

###########################################
# 1. Pull Latest Code
###########################################
log "Pulling latest code from GitHub..."
cd $APP_DIR
git pull origin main

###########################################
# 2. Update Backend
###########################################
log "Updating backend dependencies..."
cd $APP_DIR/backend
source venv/bin/activate
pip install -r requirements.txt

# Make sure .env has RESEND settings
if ! grep -q "RESEND_API_KEY" .env; then
    echo 'RESEND_API_KEY="re_QZ8LDEFu_4W4ceZXWBCoNYUAGvTCVh4KS"' >> .env
    echo 'SENDER_EMAIL="onboarding@resend.dev"' >> .env
fi

###########################################
# 3. Update Frontend
###########################################
log "Building frontend..."
cd $APP_DIR/frontend

# Update .env for production
cat > .env << EOF
VITE_API_URL=https://$DOMAIN
EOF

# Install and build
yarn install
yarn build

###########################################
# 4. Restart Services
###########################################
log "Restarting backend service..."
supervisorctl restart gamelo-backend

###########################################
# 5. Setup SSL with Certbot
###########################################
log "Setting up SSL certificate..."

# Install certbot if not installed
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
fi

# Get SSL certificate
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect

###########################################
# 6. Update Nginx for HTTPS
###########################################
log "Updating Nginx configuration..."

# Certbot should have updated nginx config, but let's make sure API proxy works
cat > /etc/nginx/sites-available/gamelo << 'NGINX_EOF'
server {
    listen 80;
    server_name gamelo.org www.gamelo.org;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name gamelo.org www.gamelo.org;
    
    ssl_certificate /etc/letsencrypt/live/gamelo.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gamelo.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    root /var/www/gamelo/frontend/dist;
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
        alias /var/www/gamelo/backend/uploads/;
    }
    
    # Frontend SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX_EOF

nginx -t && systemctl reload nginx

###########################################
# 7. Final Check
###########################################
log "Verifying installation..."
sleep 3

# Test HTTPS
if curl -s https://$DOMAIN/api/health | grep -q "healthy"; then
    log "HTTPS API: OK"
else
    warn "HTTPS API: Check backend logs"
fi

echo ""
echo "==========================================="
echo -e "${GREEN}     Update Complete!${NC}"
echo "==========================================="
echo ""
echo "Your site is now available at:"
echo "  - https://$DOMAIN"
echo "  - https://www.$DOMAIN"
echo ""
echo "SSL certificate will auto-renew."
echo ""
