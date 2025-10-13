# QRestAI API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication

Most endpoints require authentication using JWT Bearer tokens.

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## 📌 Public Routes

### Get Menu by QR Code
Get menu details by scanning QR code.

**Endpoint:** `GET /public/menu/:shortId`

**Parameters:**
- `shortId` (path) - QR code short identifier

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "menu": {
      "id": "clxxx",
      "name": "Main Menu",
      "locale": "tr",
      "isActive": true,
      "organization": {
        "id": "clxxx",
        "name": "Restaurant Name",
        "slug": "restaurant-slug"
      },
      "categories": [
        {
          "id": "clxxx",
          "name": "Appetizers",
          "description": "Start your meal",
          "sortOrder": 0,
          "items": [
            {
              "id": "clxxx",
              "name": "Grilled Salmon",
              "description": "Fresh salmon grilled to perfection",
              "price": 24.99,
              "imageUrl": "https://...",
              "isAvailable": true,
              "sortOrder": 0
            }
          ]
        }
      ]
    },
    "theme": {
      "themeKey": "default",
      "primary": "#3B82F6",
      "accent": "#10B981",
      "customCss": null
    }
  }
}
```

### Track QR Scan
Track QR code scan for analytics.

**Endpoint:** `POST /public/menu/:shortId/scan`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Scan tracked"
}
```

---

## 🔐 Authentication Routes

### Register
Create a new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "organizationName": "My Restaurant"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clxxx",
      "email": "user@example.com",
      "name": "John Doe",
      "emailVerified": false
    },
    "organization": {
      "id": "clxxx",
      "name": "My Restaurant",
      "slug": "my-restaurant",
      "plan": "FREE",
      "status": "ACTIVE"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  },
  "message": "User registered successfully"
}
```

### Login
Authenticate user and get tokens.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clxxx",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    },
    "organizations": [
      {
        "id": "clxxx",
        "name": "My Restaurant",
        "role": "OWNER"
      }
    ]
  }
}
```

### Refresh Token
Get new access token using refresh token.

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc..."
  }
}
```

### Logout
Revoke refresh token.

**Endpoint:** `POST /auth/logout`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 📖 Menu Routes

### List Menus
Get all menus for organization.

**Endpoint:** `GET /menus?orgId=<organizationId>`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx",
      "name": "Main Menu",
      "locale": "tr",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "_count": {
        "categories": 5
      }
    }
  ]
}
```

### Create Menu
Create a new menu.

**Endpoint:** `POST /menus`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "orgId": "clxxx",
  "name": "Lunch Menu",
  "locale": "en"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "orgId": "clxxx",
    "name": "Lunch Menu",
    "locale": "en",
    "isActive": true
  },
  "message": "Menu created successfully"
}
```

### Get Menu
Get menu details.

**Endpoint:** `GET /menus/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "name": "Main Menu",
    "locale": "tr",
    "isActive": true,
    "categories": [
      {
        "id": "clxxx",
        "name": "Appetizers",
        "items": [...]
      }
    ]
  }
}
```

### Update Menu
Update menu details.

**Endpoint:** `PUT /menus/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Menu Name",
  "locale": "en",
  "isActive": false
}
```

**Response:** `200 OK`

### Delete Menu
Delete a menu.

**Endpoint:** `DELETE /menus/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

---

## 📂 Category Routes

### Create Category
Add category to menu.

**Endpoint:** `POST /menus/:menuId/categories`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Main Courses",
  "description": "Our signature dishes",
  "sortOrder": 1
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "menuId": "clxxx",
    "name": "Main Courses",
    "description": "Our signature dishes",
    "sortOrder": 1
  },
  "message": "Category created successfully"
}
```

### Update Category
Update category details.

**Endpoint:** `PUT /menus/:menuId/categories/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "sortOrder": 2
}
```

**Response:** `200 OK`

### Delete Category
Delete a category.

**Endpoint:** `DELETE /menus/:menuId/categories/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

---

## 🍕 Menu Item Routes

### Create Item
Add item to category.

**Endpoint:** `POST /menus/:menuId/items`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "categoryId": "clxxx",
  "name": "Grilled Salmon",
  "description": "Fresh salmon with vegetables",
  "price": 24.99,
  "imageUrl": "https://example.com/image.jpg",
  "isAvailable": true,
  "sortOrder": 0
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "categoryId": "clxxx",
    "name": "Grilled Salmon",
    "description": "Fresh salmon with vegetables",
    "price": 24.99,
    "imageUrl": "https://example.com/image.jpg",
    "isAvailable": true,
    "sortOrder": 0
  },
  "message": "Item created successfully"
}
```

### Update Item
Update item details.

**Endpoint:** `PUT /menus/:menuId/items/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Item Name",
  "price": 29.99,
  "isAvailable": false
}
```

**Response:** `200 OK`

### Delete Item
Delete an item.

**Endpoint:** `DELETE /menus/:menuId/items/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

---

## 📱 QR Code Routes

### Generate QR Code
Generate QR code for menu.

**Endpoint:** `POST /menus/:menuId/qr`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "styleJson": {
    "foreground": "#000000",
    "background": "#FFFFFF",
    "errorCorrection": "M"
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "menuId": "clxxx",
    "shortId": "abc123",
    "styleJson": {
      "foreground": "#000000",
      "background": "#FFFFFF",
      "errorCorrection": "M"
    },
    "url": "http://localhost:3000/m/abc123"
  },
  "message": "QR code created successfully"
}
```

### Get QR Code
Get QR code details.

**Endpoint:** `GET /menus/:menuId/qr`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### Delete QR Code
Delete QR code.

**Endpoint:** `DELETE /menus/:menuId/qr`

**Headers:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

---

## 🏢 Organization Routes

### Get Organization
Get organization details.

**Endpoint:** `GET /organization/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "name": "My Restaurant",
    "slug": "my-restaurant",
    "plan": "FREE",
    "status": "ACTIVE",
    "tokens": 1000
  }
}
```

### Update Organization
Update organization details.

**Endpoint:** `PUT /organization/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Restaurant Name"
}
```

**Response:** `200 OK`

### Get Activity Logs
Get organization activity logs.

**Endpoint:** `GET /organization/:orgId/logs?page=1&limit=20&action=QR_SCAN`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)
- `action` (optional) - Filter by action type

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "clxxx",
        "action": "QR_SCAN",
        "details": {
          "shortId": "abc123",
          "menuName": "Main Menu",
          "timestamp": "2024-01-01T00:00:00.000Z"
        },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "user": {
          "id": "clxxx",
          "name": "John Doe",
          "email": "user@example.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### Get Activity Statistics
Get activity statistics.

**Endpoint:** `GET /organization/:orgId/logs/stats`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "actionCounts": [
      { "action": "QR_SCAN", "count": 152 },
      { "action": "MENU_CREATED", "count": 3 }
    ],
    "recentCount": 45
  }
}
```

---

## 🎨 Theme Routes

### Get Theme
Get theme settings.

**Endpoint:** `GET /theme/:orgId`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "orgId": "clxxx",
    "themeKey": "default",
    "primary": "#3B82F6",
    "accent": "#10B981",
    "customCss": null
  }
}
```

### Create Theme
Create theme settings.

**Endpoint:** `POST /theme/:orgId`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "themeKey": "elegant",
  "primary": "#9333EA",
  "accent": "#EC4899",
  "customCss": ".menu-item { border-radius: 10px; }"
}
```

**Response:** `201 Created`

### Update Theme
Update theme settings.

**Endpoint:** `PUT /theme/:orgId`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "primary": "#EF4444",
  "accent": "#F59E0B"
}
```

**Response:** `200 OK`

---

## ✉️ Email Verification Routes

### Send Verification Email
Send verification email to user.

**Endpoint:** `POST /verify/send-verification`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Verification email sent",
  "data": {
    "verificationLink": "http://localhost:3000/verify-email?token=..."
  }
}
```

### Verify Email
Verify email with token.

**Endpoint:** `POST /verify/verify-email`

**Request Body:**
```json
{
  "token": "verification-token-here"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "email": "user@example.com",
    "emailVerified": true
  }
}
```

### Resend Verification
Resend verification email.

**Endpoint:** `POST /verify/resend-verification`

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

---

## 🔑 Password Reset Routes

### Forgot Password
Request password reset.

**Endpoint:** `POST /password/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "If that email exists, a password reset link has been sent",
  "data": {
    "resetLink": "http://localhost:3000/reset-password?token=..."
  }
}
```

### Verify Reset Token
Verify password reset token.

**Endpoint:** `POST /password/verify-reset-token`

**Request Body:**
```json
{
  "token": "reset-token-here"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "email": "user@example.com"
  }
}
```

### Reset Password
Reset password with token.

**Endpoint:** `POST /password/reset-password`

**Request Body:**
```json
{
  "token": "reset-token-here",
  "newPassword": "newsecurepassword"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## 👨‍💼 Admin Routes

### List All Users
Get all users (admin only).

**Endpoint:** `GET /admin/users?page=1&limit=10&search=john`

**Headers:** `Authorization: Bearer <admin-token>`

**Query Parameters:**
- `page` (optional) - Page number
- `limit` (optional) - Items per page
- `search` (optional) - Search by email or name

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "clxxx",
        "email": "user@example.com",
        "name": "John Doe",
        "emailVerified": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "organizations": [
          {
            "organization": {
              "id": "clxxx",
              "name": "My Restaurant",
              "slug": "my-restaurant",
              "plan": "FREE"
            }
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

### Get User
Get user details (admin only).

**Endpoint:** `GET /admin/users/:id`

**Headers:** `Authorization: Bearer <admin-token>`

**Response:** `200 OK`

### Update User
Update user (admin only).

**Endpoint:** `PUT /admin/users/:id`

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "name": "Updated Name",
  "emailVerified": true
}
```

**Response:** `200 OK`

### Delete User
Delete user (admin only).

**Endpoint:** `DELETE /admin/users/:id`

**Headers:** `Authorization: Bearer <admin-token>`

**Response:** `204 No Content`

### List All Menus
Get all menus across organizations (admin only).

**Endpoint:** `GET /admin/menus?page=1&limit=10&search=lunch&orgId=clxxx`

**Headers:** `Authorization: Bearer <admin-token>`

**Response:** `200 OK`

### Get Menu Stats
Get menu statistics (admin only).

**Endpoint:** `GET /admin/menus/:id/stats`

**Headers:** `Authorization: Bearer <admin-token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "categoriesCount": 5,
    "itemsCount": 42
  }
}
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error",
  "message": "Invalid request data",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication error",
  "message": "No token provided"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Authorization error",
  "message": "You do not have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Not found",
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "Conflict",
  "message": "Email already registered"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format
- All IDs use CUID format
- Pagination defaults: page=1, limit=10
- JWT tokens expire after 15 minutes (access) and 7 days (refresh)
- Password reset tokens expire after 1 hour
- Email verification tokens expire after 24 hours
