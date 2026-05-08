# PDL Admin Portal - API Documentation

## Base URL
`http://localhost:4000/api`

## Authentication
All protected endpoints require a valid JWT token. Include the token in:
- Cookie: `token=<your_jwt_token>`
- Header: `Authorization: Bearer <your_jwt_token>`

## Login Types
The system supports two types of users:
1. **Admin**: Full access to all features
2. **Regular User**: Limited access based on role

---

## Authentication Endpoints

### POST /login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "ok": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "type": "user",
    "name": "John User",
    "role": "user"
  },
  "token": "jwt_token_here"
}
```

### POST /admin/logout
Logout the current user.

**Response:**
```json
{
  "ok": true
}
```

### GET /me
Get current user information.

**Response:**
```json
{
  "ok": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "type": "user",
    "name": "John User",
    "role": "user"
  }
}
```

---

## User Management (Admin Only)

### GET /users
Get all users with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "ok": true,
  "users": [
    {
      "id": 1,
      "name": "John User",
      "email": "user@example.com",
      "role": "user",
      "status": "active",
      "created_at": "2026-05-08T11:19:13.000Z",
      "updated_at": "2026-05-08T11:19:13.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

### POST /users
Create a new user (Admin only).

**Request Body:**
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "user",
  "status": "active"
}
```

**Response:**
```json
{
  "ok": true,
  "user": {
    "id": 4,
    "name": "New User",
    "email": "newuser@example.com",
    "role": "user",
    "status": "active"
  }
}
```

### PUT /users/:id
Update user information (Admin can update any user, users can only update themselves).

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "manager",
  "status": "active",
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

**Response:**
```json
{
  "ok": true,
  "user": {
    "id": 1,
    "name": "Updated Name",
    "email": "updated@example.com",
    "role": "manager",
    "status": "active"
  }
}
```

### DELETE /users/:id
Delete a user (Admin only).

**Response:**
```json
{
  "ok": true,
  "message": "User deleted successfully"
}
```

---

## Sericulturist Management

### GET /sericulturists
Get all sericulturists with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for name/email
- `status` (optional): Filter by status (active/inactive)

**Response:**
```json
{
  "ok": true,
  "sericulturists": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "address": "123 Main St, City",
      "status": "active",
      "created_at": "2026-04-06T07:39:22.000Z",
      "updated_at": "2026-04-06T07:39:22.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

### GET /sericulturists/:id
Get a specific sericulturist by ID.

**Response:**
```json
{
  "ok": true,
  "sericulturist": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "address": "123 Main St, City",
    "status": "active",
    "created_at": "2026-04-06T07:39:22.000Z",
    "updated_at": "2026-04-06T07:39:22.000Z"
  }
}
```

### POST /sericulturists
Create a new sericulturist.

**Request Body:**
```json
{
  "name": "New Sericulturist",
  "email": "new@example.com",
  "phone": "1234567890",
  "address": "New Address",
  "status": "active"
}
```

**Response:**
```json
{
  "ok": true,
  "sericulturist": {
    "id": 4,
    "name": "New Sericulturist",
    "email": "new@example.com",
    "phone": "1234567890",
    "address": "New Address",
    "status": "active"
  }
}
```

### PUT /sericulturists/:id
Update a sericulturist.

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "phone": "9876543210",
  "address": "Updated Address",
  "status": "inactive"
}
```

**Response:**
```json
{
  "ok": true,
  "sericulturist": {
    "id": 1,
    "name": "Updated Name",
    "email": "updated@example.com",
    "phone": "9876543210",
    "address": "Updated Address",
    "status": "inactive"
  }
}
```

### DELETE /sericulturists/:id
Delete a sericulturist.

**Response:**
```json
{
  "ok": true,
  "message": "Sericulturist deleted successfully"
}
```

### PUT /sericulturists/bulk/status
Bulk update status for multiple sericulturists.

**Request Body:**
```json
{
  "ids": [1, 2, 3],
  "status": "inactive"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "3 sericulturists updated successfully"
}
```

### DELETE /sericulturists/bulk
Bulk delete multiple sericulturists.

**Request Body:**
```json
{
  "ids": [1, 2, 3]
}
```

**Response:**
```json
{
  "ok": true,
  "message": "3 sericulturists deleted successfully"
}
```

---

## Dashboard & Statistics

### GET /admin/dashboard
Get dashboard data (Admin only).

**Response:**
```json
{
  "ok": true,
  "message": "Welcome, admin@example.com!",
  "statistics": {
    "totalSericulturists": 3,
    "activeSericulturists": 3,
    "totalSchemes": 0,
    "activeUsers": 1
  }
}
```

### GET /sericulturists/statistics
Get sericulturist statistics.

**Response:**
```json
{
  "ok": true,
  "statistics": {
    "totalSericulturists": 3,
    "activeSericulturists": 3,
    "inactiveSericulturists": 0,
    "newThisMonth": 0
  }
}
```

---

## Database Viewer (Development Only)

### GET /database/view
View all database tables and data (No authentication required for local development).

**Response:**
```json
{
  "ok": true,
  "database": {
    "users": {
      "columns": [...],
      "data": [...],
      "count": 3
    },
    "sericulturists": {
      "columns": [...],
      "data": [...],
      "count": 3
    }
  }
}
```

---

## Default Login Credentials

### Admin Account
- **Email**: `admin@example.com`
- **Password**: `Admin123!`
- **Type**: Admin
- **Access**: Full system access

### Sample Users
- **John User**: `user@example.com` / `User123!` (role: user)
- **Jane Manager**: `manager@example.com` / `Manager123!` (role: manager)
- **Bob Viewer**: `viewer@example.com` / `Viewer123!` (role: viewer)

---

## Error Responses

All endpoints return appropriate HTTP status codes:

- **200**: Success
- **201**: Created successfully
- **400**: Bad request (missing/invalid data)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not found
- **500**: Internal server error

Error response format:
```json
{
  "error": "Error message description"
}
```

---

## CORS Configuration

The API is configured to accept requests from:
- `http://localhost:5173` (Vite dev server)
- `http://127.0.0.1:60039` (Browser preview)
- All localhost and 127.0.0.1 origins for local development
