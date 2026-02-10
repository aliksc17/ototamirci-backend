#!/bin/bash
# OtoTamirci VPS Kurulum Scripti - Ubuntu 22.04 LTS

echo "==================================="
echo "🚀 OtoTamirci VPS Kurulumu Başlıyor"
echo "==================================="

# Sistem güncellemesi
echo "[1/9] Sistem güncelleniyor..."
apt update && apt upgrade -y

# Temel araçlar
echo "[2/9] Temel araçlar kuruluyor..."
apt install -y curl wget git ufw build-essential

# Node.js 20 kurulumu
echo "[3/9] Node.js 20 kuruluyor..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
echo "Node.js versiyonu: $(node --version)"
echo "NPM versiyonu: $(npm --version)"

# PostgreSQL 15 kurulumu
echo "[4/9] PostgreSQL 15 kuruluyor..."
apt install -y postgresql postgresql-contrib

# PostgreSQL başlatma
systemctl start postgresql
systemctl enable postgresql

# Database ve kullanıcı oluşturma
echo "[5/9] PostgreSQL database ayarlanıyor..."
sudo -u postgres psql -c "CREATE USER ototamirci WITH PASSWORD 'OtoTamirci2026!Secure';"
sudo -u postgres psql -c "CREATE DATABASE ototamirci_db OWNER ototamirci;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ototamirci_db TO ototamirci;"
sudo -u postgres psql -c "ALTER USER ototamirci CREATEDB;"

echo "✅ PostgreSQL kuruldu - Database: ototamirci_db"

# PM2 kurulumu (process manager)
echo "[6/9] PM2 kuruluyor..."
npm install -g pm2

# Nginx kurulumu
echo "[7/9] Nginx kuruluyor..."
apt install -y nginx

# Firewall ayarları
echo "[8/9] Firewall ayarlanıyor..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 5000/tcp
echo "y" | ufw enable

# Proje klasörü oluşturma
echo "[9/9] Proje klasörü hazırlanıyor..."
mkdir -p /var/www/ototamirci
cd /var/www/ototamirci

# Backend'i klonlama
echo "Backend indiriliyor..."
git clone https://github.com/aliksc17/ototamirci-backend.git
cd ototamirci-backend

# Dependencies
echo "Backend bağımlılıkları yükleniyor..."
npm install

# .env dosyası oluşturma
echo "Backend .env dosyası oluşturuluyor..."
cat > .env << 'EOF'
DATABASE_URL=postgresql://ototamirci:OtoTamirci2026!Secure@localhost:5432/ototamirci_db
JWT_SECRET=OtoTamirci_JWT_Super_Secret_Key_2026_Production
NODE_ENV=production
PORT=5000
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
FRONTEND_URL=http://31.210.36.76
EOF

# Database migration
echo "Database tabloları oluşturuluyor..."
npm run db:init

# Build
echo "Backend build ediliyor..."
npm run build

# PM2 ile başlatma
echo "Backend PM2 ile başlatılıyor..."
pm2 start dist/server.js --name ototamirci-api
pm2 startup
pm2 save

# Nginx konfigürasyonu
echo "Nginx konfigürasyonu yapılıyor..."
cat > /etc/nginx/sites-available/ototamirci << 'EOF'
server {
    listen 80;
    server_name 31.210.36.76;

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Frontend (React build)
    location / {
        root /var/www/ototamirci/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
EOF

ln -sf /etc/nginx/sites-available/ototamirci /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo ""
echo "==================================="
echo "✅ KURULUM TAMAMLANDI!"
echo "==================================="
echo ""
echo "📋 Bilgiler:"
echo "  - Backend API: http://31.210.36.76/api"
echo "  - Health Check: http://31.210.36.76/health"
echo "  - Database: postgresql://localhost:5432/ototamirci_db"
echo ""
echo "🔧 Yararlı Komutlar:"
echo "  pm2 status              → Uygulamanın durumunu göster"
echo "  pm2 logs ototamirci-api → Log'ları izle"
echo "  pm2 restart all         → Uygulamayı yeniden başlat"
echo "  pm2 stop all            → Uygulamayı durdur"
echo ""
echo "📝 .env dosyasını düzenlemek için:"
echo "  nano /var/www/ototamirci/ototamirci-backend/.env"
echo ""
echo "🔒 Güvenlik Önerisi:"
echo "  - Root şifresi değiştirin: passwd"
echo "  - Yeni sudo kullanıcı oluşturun"
echo "  - SSH key authentication aktifleştirin"
echo ""
