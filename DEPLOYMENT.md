# Render.com Deployment Guide

## 🚀 Render.com'a Deploy Adımları

### 1. GitHub Repository Oluştur

1. [GitHub](https://github.com/new)'da yeni repo oluştur (örn: `ototamirci-backend`)
2. README eklemeden oluştur

### 2. Kodu GitHub'a Push Et

Terminalde şu komutları çalıştır:

```bash
cd ototamirci-backend

# Remote ekle (kendi repo URL'inle değiştir)
git remote add origin https://github.com/KULLANICI_ADIN/ototamirci-backend.git

# Dosyaları ekle
git add .

# Commit
git commit -m "Initial commit - Ototamirci Backend API"

# Push
git push -u origin main
```

### 3. Render.com'da Web Service Oluştur

1. [Render.com](https://render.com)'a kayıt ol/giriş yap
2. **New +** > **Web Service** tıkla
3. GitHub repository'ni bağla ve seç
4. Ayarlar:
   - **Name:** `ototamirci-api` (veya istediğin)
   - **Region:** Frankfurt
   - **Branch:** `main`
   - **Root Directory:** boş bırak
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free

### 4. Environment Variables Ekle

Render dashboard'da **Environment** sekmesinden ekle:

```
DATABASE_URL=postgresql://postgres:Z53Te&ET2C85rgc@db.tfmgpquzfdsjjxyiqnzw.supabase.co:5432/postgres
JWT_SECRET=dev-secret-key-change-in-production-12345678
JWT_EXPIRES_IN=7d
NODE_ENV=production
FRONTEND_URL=http://localhost:3000
```

⚠️ **Önemli:** `FRONTEND_URL`'i daha sonra Vercel/Netlify URL'inle güncelleyeceksin!

### 5. Deploy!

- **Create Web Service** butonuna tıkla
- Deploy otomatik başlayacak (3-5 dakika sürer)
- URL: `https://ototamirci-api.onrender.com` (veya benzeri)

### 6. API'yi Test Et

```bash
# Health check
curl https://RENDER_URL/health

# Login test
curl -X POST https://RENDER_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmet@example.com","password":"password123"}'
```

### 7. Frontend'i Güncelle

Frontend `.env` dosyasını güncelle:

```
VITE_API_URL=https://RENDER_URL/api
```

## 📝 Notlar

- **Free Tier:** 750 saat/ay ücretsiz
- **Sleep:** 15 dakika inaktiflikten sonra uyur, ilk istek 30-60 saniye sürebilir
- **Auto Deploy:** Her git push'ta otomatik deploy olur
- **Logs:** Render dashboard'dan canlı logları görebilirsin

## 🔄 Güncellemeler

Kod güncellemek için:

```bash
git add .
git commit -m "Update message"
git push
```

Render otomatik deploy edecek!

## ⚠️ Production için Öneriler

1. `JWT_SECRET`'i güçlü bir şifre ile değiştir
2. Rate limiting ekle (express-rate-limit)
3. Helmet.js ekle (güvenlik headers)
4. CORS'u production domain'e sınırla

## 📚 Daha Fazla Bilgi

- [Render Docs](https://render.com/docs)
- [Node.js Deploy Guide](https://render.com/docs/deploy-node-express-app)
