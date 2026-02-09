# Ototamirci Backend API

🚗 Oto tamirci bulma platformu - Backend API

## 🚀 Production URL

API Base URL: `https://ototamirci-api.onrender.com/api`

## 📋 Tech Stack

- Node.js + Express
- TypeScript
- PostgreSQL (Supabase)
- JWT Authentication

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Kayıt ol
- `POST /api/auth/login` - Giriş yap
- `GET /api/auth/me` - Mevcut kullanıcı

### Shops
- `GET /api/shops` - Yakındaki dükkanları listele
- `GET /api/shops/:id` - Dükkan detayı
- `POST /api/shops` - Dükkan oluştur (mechanic)

### Appointments
- `GET /api/appointments` - Randevuları listele
- `POST /api/appointments` - Randevu oluştur

## 📦 Deploy

Deploy guide için [DEPLOYMENT.md](DEPLOYMENT.md) dosyasına bakın.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials

4. Create PostgreSQL database:
```bash
createdb ototamirci_db
```

5. Initialize database schema:
```bash
npm run db:init
```

6. (Optional) Seed database with mock data:
```bash
npx ts-node src/scripts/seedDb.ts
```

## Development

Start development server with hot reload:
```bash
npm run dev
```

## Build

Build for production:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (auth required)
- `PUT /api/auth/profile` - Update profile (auth required)

### Shops
- `GET /api/shops?lat=X&lng=Y&radius=10` - Get nearby shops
- `GET /api/shops/:id` - Get shop details
- `POST /api/shops` - Create shop (mechanic only)
- `PUT /api/shops/:id` - Update shop (owner only)
- `PATCH /api/shops/:id/availability` - Update availability
- `DELETE /api/shops/:id` - Delete shop (owner only)

### Appointments
- `GET /api/appointments` - Get appointments (filtered by role)
- `GET /api/appointments/:id` - Get appointment details
- `POST /api/appointments` - Create appointment (customer only)
- `PATCH /api/appointments/:id` - Update appointment status
- `DELETE /api/appointments/:id` - Delete appointment

## Test Credentials

After seeding:
- **Customer**: ahmet@example.com / password123
- **Mechanic**: mehmet@sanayi.com / password123
