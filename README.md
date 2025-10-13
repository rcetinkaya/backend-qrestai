# QRestAI Backend

Backend API for QR Menu System - Express, Prisma, PostgreSQL, Redis

## 🚀 Features

- ✅ **Express.js** REST API
- ✅ **Prisma ORM** with PostgreSQL
- ✅ **Redis** for caching and rate limiting
- ✅ **JWT Authentication** (access + refresh tokens)
- ✅ **Role-based Authorization** (OWNER, ADMIN, EDITOR, VIEWER)
- ✅ **Zod Validation** on all endpoints
- ✅ **Error Handling** (global middleware)
- ✅ **Rate Limiting** (Redis-backed)
- ✅ **Request Logging**
- ✅ **Multi-tenant** support
- ✅ **TypeScript** type safety
- ✅ **Jest** testing setup
- ✨ **AI-Powered Features** (OpenAI integration)
  - AI description generation
  - Multi-language translation
  - Complete menu generation
  - Image prompt generation
  - Description optimization
  - Credit-based monetization system

## 📦 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express 4
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **ORM**: Prisma 6
- **Validation**: Zod
- **Auth**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, bcrypt
- **Testing**: Jest, Supertest

## 🛠️ Setup

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Setup Environment

\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

**Required environment variables:**
- `OPENAI_API_KEY` - Your OpenAI API key for AI features (get from https://platform.openai.com/api-keys)

### 3. Start Database (Docker)

\`\`\`bash
npm run docker:up
\`\`\`

This starts PostgreSQL on port 5434 and Redis on port 6381.

### 4. Run Migrations

\`\`\`bash
npx prisma migrate dev
\`\`\`

### 5. (Optional) Seed Database

\`\`\`bash
npx prisma db seed
\`\`\`

This creates:
- Test organization: "Test Restaurant"
- Test users: owner@test.com, admin@test.com
- Password: password123
- Sample menu with categories and items

### 6. Generate Prisma Client

\`\`\`bash
npm run prisma:generate
\`\`\`

### 7. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

Server will start on http://localhost:3001

## 📝 API Endpoints

### Health Check
\`GET /api/health\` - Server health status

### Authentication
\`POST /api/auth/register\` - Register new user + organization
\`POST /api/auth/login\` - Login user
\`POST /api/auth/refresh\` - Refresh access token
\`POST /api/auth/logout\` - Logout (revoke refresh token)
\`GET /api/auth/me\` - Get current user (protected)

### Menus
\`GET /api/menus\` - List all menus (paginated)
\`GET /api/menus/:id\` - Get menu by ID
\`POST /api/menus\` - Create menu (requires EDITOR role)
\`PUT /api/menus/:id\` - Update menu (requires EDITOR role)
\`DELETE /api/menus/:id\` - Delete menu (requires ADMIN role)
\`POST /api/menus/:id/duplicate\` - Duplicate menu (requires EDITOR role)

### AI Features
\`POST /api/organization/:orgId/ai/generate-description\` - Generate item description
\`POST /api/organization/:orgId/ai/translate-item\` - Translate menu item
\`POST /api/organization/:orgId/ai/generate-menu\` - Generate complete menu
\`POST /api/organization/:orgId/ai/generate-image-prompt\` - Generate image prompt
\`POST /api/organization/:orgId/ai/optimize-description\` - Optimize description
\`GET /api/organization/:orgId/ai/credits\` - Get AI credit balance
\`GET /api/organization/:orgId/ai/transactions\` - Get credit transactions
\`GET /api/organization/:orgId/ai/usage-stats\` - Get usage statistics
\`GET /api/organization/:orgId/ai/packages\` - Get available credit packages
\`POST /api/organization/:orgId/ai/purchase-package\` - Purchase credits
\`GET /api/organization/:orgId/ai/history\` - Get AI generated content history

### More Endpoints
- Categories: \`/api/categories\`
- Menu Items: \`/api/items\`
- QR Codes: \`/api/qr\`
- Organization: \`/api/organization\`
- Theme: \`/api/theme\`
- Admin: \`/api/admin\`

## 🧪 Testing

\`\`\`bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
\`\`\`

## 🔧 Scripts

\`\`\`bash
npm run dev           # Start development server
npm run build         # Build for production
npm start             # Start production server
npm test              # Run tests
npm run lint          # Lint code
npm run format        # Format code with Prettier
npm run prisma:studio # Open Prisma Studio
npm run docker:up     # Start Docker services
npm run docker:down   # Stop Docker services
\`\`\`

## 🗂️ Project Structure

\`\`\`
src/
├── config/          # Configuration (env, database, redis, jwt, etc.)
├── controllers/     # Request handlers
├── middleware/      # Express middleware (auth, validation, errors)
├── routes/          # API routes
├── services/        # Business logic
├── types/           # TypeScript types
├── utils/           # Utility functions
├── validators/      # Zod schemas
└── index.ts         # App entry point

prisma/
├── schema.prisma    # Database schema
└── seed.ts          # Seed script
\`\`\`

## 🔐 Authentication Flow

1. User registers or logs in → receives access token + refresh token
2. Access token (short-lived, 15m) used for API requests
3. Refresh token (long-lived, 7d) used to get new access token
4. Protected routes require \`Authorization: Bearer <accessToken>\` header

## 👥 User Roles

- **VIEWER**: Read-only access
- **EDITOR**: Can create/edit menus
- **ADMIN**: Can delete resources
- **OWNER**: Full organization control

## 🔒 Environment Variables

See \`.env.example\` for required variables:
- DATABASE_URL
- REDIS_URL
- JWT_SECRET
- JWT_REFRESH_SECRET
- ALLOWED_ORIGINS

## 📊 Database Schema

- **Organization** - Multi-tenant root (with AI credit fields)
- **User** - User accounts
- **UserOrganization** - User-org relationship with roles
- **Menu** - Restaurant menus
- **Category** - Menu categories
- **MenuItem** - Menu items
- **QrCode** - QR codes for menus
- **ThemeSetting** - Theme customization
- **RefreshToken** - JWT refresh tokens
- **ActivityLog** - Audit trail
- **SubscriptionPlan** - AI subscription tiers (FREE to ENTERPRISE)
- **CreditPackage** - AI credit add-on packages
- **AICreditTransaction** - AI credit transaction history
- **AIGeneratedContent** - AI-generated content audit trail

## 🐛 Troubleshooting

**Database connection error**:
- Check if PostgreSQL is running: \`docker ps\`
- Verify DATABASE_URL in .env

**Redis connection error**:
- Check if Redis is running: \`docker ps\`
- Verify REDIS_URL in .env

**Port already in use**:
- Change PORT in .env
- Kill process using port: \`lsof -ti:3001 | xargs kill\`

## 📄 License

MIT

## 👨‍💻 Development

Developed for QRestAI - QR Menu System
