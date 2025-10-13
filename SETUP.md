# QRestAI Backend - Setup Guide

## ✅ Başarıyla Çalışıyor

Server başarıyla başlatıldı ve tüm endpoint'ler çalışır durumda!

## 🚀 Hızlı Başlangıç

### 1. Docker Servislerini Başlat

```bash
npm run docker:up
```

Bu komut PostgreSQL ve Redis konteynerlerini başlatır.

### 2. Environment Variables

`.env` dosyası hazır. Gerekirse düzenleyebilirsiniz:

```bash
# Database
DATABASE_URL="postgresql://qrestai_user:qrestai_password@localhost:5434/qrestai_db"

# Redis
REDIS_URL="redis://localhost:6381"

# JWT (minimum 32 karakter)
JWT_SECRET="dev-secret-key-qrestai-2025-secure"
JWT_REFRESH_SECRET="dev-refresh-secret-key-qrestai-2025-secure"
```

### 3. Database Migration

```bash
npx prisma migrate dev
```

### 4. Dependencies Kurulumu

```bash
npm install
```

### 5. Development Server

```bash
npm run dev
```

veya Production Build:

```bash
npm run build
npm start
```

## 📚 API Dokümantasyonu

Server başlatıldığında otomatik olarak şu URL'ler aktif olur:

- **API Base**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health
- **Swagger UI**: http://localhost:3001/api-docs
- **Swagger JSON**: http://localhost:3001/api-docs.json

## 🔧 Düzeltilen Sorunlar

### 1. JWT Secret Uzunluğu
- Minimum 32 karakter olması gerekiyordu
- `.env` dosyasında güncellendi

### 2. bcrypt Native Module
- Windows'ta yeniden derlenmesi gerekti
- `npm rebuild bcrypt` ile çözüldü

### 3. TypeScript Derleme Hataları
- JWT token type casting hataları düzeltildi
- Unused imports temizlendi
- QR code service JSON type casting eklendi
- Token utils SignOptions düzenlendi

### 4. Prisma Migration
- İlk migration `init` olarak oluşturuldu
- Database şeması senkronize edildi

## ✨ Özellikler

- ✅ **Express.js** - Web framework
- ✅ **Prisma ORM** - Database ORM
- ✅ **PostgreSQL** - Ana database
- ✅ **Redis** - Cache ve rate limiting
- ✅ **JWT Authentication** - Token-based auth
- ✅ **Swagger/OpenAPI** - API dokümantasyonu
- ✅ **Role-based Authorization** - OWNER, ADMIN, EDITOR, VIEWER
- ✅ **Zod Validation** - Request validation
- ✅ **Helmet** - Security headers
- ✅ **CORS** - Cross-origin support
- ✅ **Rate Limiting** - Redis-based
- ✅ **Request Logging** - Winston logger
- ✅ **Error Handling** - Centralized error handler
- ✅ **Jest Tests** - Unit ve integration tests

## 📁 Proje Yapısı

```
backend-qrestai/
├── src/
│   ├── config/          # Konfigürasyon dosyaları
│   ├── controllers/     # Route controller'ları
│   ├── middleware/      # Express middleware'ler
│   ├── routes/
│   │   ├── admin/      # Admin panel routes
│   │   └── customer/   # Customer panel routes
│   ├── services/        # Business logic
│   ├── types/          # TypeScript type tanımlamaları
│   ├── utils/          # Utility fonksiyonlar
│   ├── validators/     # Zod validation schemas
│   └── index.ts        # Ana entry point
├── prisma/
│   ├── schema.prisma   # Database şeması
│   └── migrations/     # Migration dosyaları
└── tests/              # Test dosyaları
```

## 🧪 Testler

```bash
# Tüm testleri çalıştır
npm test

# Watch mode
npm run test:watch

# Coverage raporu
npm run test:coverage
```

## 📝 Mevcut Endpoint'ler

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Giriş
- `POST /api/auth/refresh` - Token yenileme
- `POST /api/auth/logout` - Çıkış
- `GET /api/auth/me` - Mevcut kullanıcı

### Menus
- `GET /api/menus` - Tüm menüler
- `GET /api/menus/:id` - Menü detayı
- `POST /api/menus` - Yeni menü
- `PUT /api/menus/:id` - Menü güncelle
- `DELETE /api/menus/:id` - Menü sil
- `POST /api/menus/:id/duplicate` - Menü kopyala

### Admin
- `GET /api/admin/organizations` - Tüm organizasyonlar
- `PATCH /api/admin/organizations/:orgId/status` - Status güncelle
- `PATCH /api/admin/organizations/:orgId/plan` - Plan güncelle
- `GET /api/admin/stats/dashboard` - Dashboard istatistikleri

## 🛠️ Yararlı Komutlar

```bash
# Docker servislerini durdur
npm run docker:down

# Docker loglarını görüntüle
npm run docker:logs

# Prisma Studio (Database GUI)
npm run prisma:studio

# Prisma Client yeniden oluştur
npm run prisma:generate

# Code linting
npm run lint

# Code formatting
npm run format
```

## 🎯 Sonraki Adımlar

1. Frontend projelerini (admin-qrestai ve qrestai) başlat
2. API Client'ları test et
3. Authentication flow'unu test et
4. Seed data ekle (optional)

## ⚠️ Notlar

- Production'da `OPENAI_API_KEY` eklenebilir (AI özellikleri için)
- JWT secret'ları production'da daha güçlü olmalı
- CORS ayarlarını production domain'lerine göre güncelle
- Rate limit değerlerini production ihtiyaçlarına göre ayarla
