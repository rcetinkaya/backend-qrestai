# QRestAI API Endpoints

Complete list of all available API endpoints.

**Base URL**: `http://localhost:3001/api`

## 🏗️ Route Structure

The API is organized into two main sections:

- **Customer Panel Routes**: `/api/*` - For restaurant owners (menu management, QR codes, etc.)
- **Admin Panel Routes**: `/api/admin/*` - For system administrators

## 📋 Table of Contents

### Customer Panel
- [Health Check](#health-check)
- [Authentication](#authentication)
- [Menus](#menus)
- [Categories](#categories)
- [Menu Items](#menu-items)
- [QR Codes](#qr-codes)
- [Organization](#organization)
- [Theme](#theme)

### Admin Panel
- [Admin - Organizations](#admin---organizations)
- [Admin - Statistics](#admin---statistics)

---

## Health Check

### Check API Health
```http
GET /health
```
**Auth**: None
**Response**: Server status, uptime, timestamp

---

## Authentication

### Register New User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "John Doe",
  "organizationName": "My Restaurant",
  "organizationSlug": "my-restaurant"
}
```
**Response**: User, tokens, organization

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}
```
**Response**: User, tokens, organization

### Refresh Access Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```
**Response**: New access token

### Logout
```http
POST /auth/logout
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```
**Response**: Success message

### Get Current User
```http
GET /auth/me
Authorization: Bearer <access-token>
```
**Response**: User details with organizations

---

## Menus

### List All Menus
```http
GET /menus?page=1&limit=10&search=summer
Authorization: Bearer <access-token>
```
**Response**: Paginated menus list

### Get Menu by ID
```http
GET /menus/:id
Authorization: Bearer <access-token>
```
**Response**: Menu with categories and items

### Create Menu
```http
POST /menus
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "Summer Menu",
  "locale": "tr"
}
```
**Required Role**: EDITOR
**Response**: Created menu

### Update Menu
```http
PUT /menus/:id
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "Updated Menu Name",
  "isActive": true
}
```
**Required Role**: EDITOR
**Response**: Updated menu

### Delete Menu
```http
DELETE /menus/:id
Authorization: Bearer <access-token>
```
**Required Role**: ADMIN
**Response**: 204 No Content

### Duplicate Menu
```http
POST /menus/:id/duplicate
Authorization: Bearer <access-token>
```
**Required Role**: EDITOR
**Response**: Duplicated menu with all categories and items

---

## Categories

### List Categories for Menu
```http
GET /menus/:menuId/categories
Authorization: Bearer <access-token>
```
**Response**: List of categories with item counts

### Get Category by ID
```http
GET /menus/:menuId/categories/:categoryId
Authorization: Bearer <access-token>
```
**Response**: Category with items

### Create Category
```http
POST /menus/:menuId/categories
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "Beverages",
  "description": "Hot and cold drinks",
  "sortOrder": 0
}
```
**Required Role**: EDITOR
**Response**: Created category

### Update Category
```http
PUT /menus/:menuId/categories/:categoryId
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "Updated Category",
  "sortOrder": 1
}
```
**Required Role**: EDITOR
**Response**: Updated category

### Delete Category
```http
DELETE /menus/:menuId/categories/:categoryId
Authorization: Bearer <access-token>
```
**Required Role**: ADMIN
**Response**: 204 No Content

### Reorder Categories
```http
POST /menus/:menuId/categories/reorder
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "categoryIds": ["cat-id-1", "cat-id-2", "cat-id-3"]
}
```
**Required Role**: EDITOR
**Response**: Success message

---

## Menu Items

### List Items in Category
```http
GET /menus/:menuId/categories/:categoryId/items
Authorization: Bearer <access-token>
```
**Response**: List of menu items

### Get Item by ID
```http
GET /menus/:menuId/categories/:categoryId/items/:itemId
Authorization: Bearer <access-token>
```
**Response**: Menu item details

### Create Menu Item
```http
POST /menus/:menuId/categories/:categoryId/items
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "Cappuccino",
  "description": "Italian coffee with milk",
  "price": 45.0,
  "imageUrl": "https://example.com/cappuccino.jpg",
  "isAvailable": true,
  "sortOrder": 0
}
```
**Required Role**: EDITOR
**Response**: Created item

### Update Menu Item
```http
PUT /menus/:menuId/categories/:categoryId/items/:itemId
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "Updated Item",
  "price": 50.0,
  "isAvailable": false
}
```
**Required Role**: EDITOR
**Response**: Updated item

### Delete Menu Item
```http
DELETE /menus/:menuId/categories/:categoryId/items/:itemId
Authorization: Bearer <access-token>
```
**Required Role**: ADMIN
**Response**: 204 No Content

### Reorder Items
```http
POST /menus/:menuId/categories/:categoryId/items/reorder
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "itemIds": ["item-id-1", "item-id-2", "item-id-3"]
}
```
**Required Role**: EDITOR
**Response**: Success message

---

## QR Codes

### Get QR Code for Menu
```http
GET /menus/:menuId/qr
Authorization: Bearer <access-token>
```
**Response**: QR code data with shortId and style

### Generate QR Code
```http
POST /menus/:menuId/qr
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "style": {
    "foreground": "#000000",
    "background": "#FFFFFF",
    "errorCorrection": "M"
  }
}
```
**Required Role**: EDITOR
**Response**: Created QR code

### Update QR Code Style
```http
PATCH /menus/:menuId/qr
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "style": {
    "foreground": "#FF0000"
  }
}
```
**Required Role**: EDITOR
**Response**: Updated QR code

---

## Organization

### Get Current Organization
```http
GET /organization
Authorization: Bearer <access-token>
```
**Response**: Organization details with theme and counts

### Update Organization
```http
PATCH /organization
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "New Restaurant Name",
  "slug": "new-slug"
}
```
**Required Role**: OWNER
**Response**: Updated organization

### Get Organization Members
```http
GET /organization/members
Authorization: Bearer <access-token>
```
**Response**: List of members with roles

### Update Member Role
```http
PATCH /organization/members/:userId/role
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "role": "ADMIN"
}
```
**Required Role**: OWNER
**Response**: Success message

### Remove Member
```http
DELETE /organization/members/:userId
Authorization: Bearer <access-token>
```
**Required Role**: ADMIN or OWNER
**Response**: 204 No Content

---

## Theme

### Get Organization Theme
```http
GET /theme
Authorization: Bearer <access-token>
```
**Response**: Theme settings (creates default if not exists)

### Update Theme
```http
PUT /theme
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "themeKey": "modern",
  "primary": "#3B82F6",
  "accent": "#10B981",
  "customCss": ".menu { font-size: 16px; }"
}
```
**Required Role**: ADMIN
**Response**: Updated theme

---

## Admin - Organizations

**Base Path**: `/api/admin/organizations`

### Get All Organizations
```http
GET /admin/organizations?page=1&limit=20
Authorization: Bearer <access-token>
```
**Note**: Add proper admin authentication in production
**Response**: Paginated organizations list

### Update Organization Status
```http
PATCH /admin/organizations/:orgId/status
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "status": "SUSPENDED"
}
```
**Values**: ACTIVE, SUSPENDED, DELETED
**Response**: Updated organization

### Update Organization Plan
```http
PATCH /admin/organizations/:orgId/plan
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "plan": "PRO"
}
```
**Values**: FREE, PRO, BUSINESS
**Response**: Updated organization

---

## Admin - Statistics

**Base Path**: `/api/admin/stats`

### Get Dashboard Statistics
```http
GET /admin/stats/dashboard
Authorization: Bearer <access-token>
```
**Response**: Dashboard stats (total orgs, users, menus, signups)

---

## 🔐 Authentication

All protected endpoints require `Authorization` header:
```
Authorization: Bearer <access-token>
```

Access tokens expire in **15 minutes**. Use refresh token to get new access token.

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "ErrorType",
  "message": "Detailed error message",
  "statusCode": 400
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "data": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## 👥 User Roles

- **VIEWER**: Read-only access
- **EDITOR**: Can create/edit menus, categories, items
- **ADMIN**: Can delete resources, manage theme
- **OWNER**: Full control, can manage members and organization

## 📝 Notes

- All timestamps are in ISO 8601 format
- Prices are in float format (e.g., 45.50)
- IDs use CUID format
- Locale is ISO 639-1 (2-letter code, e.g., "tr", "en")
