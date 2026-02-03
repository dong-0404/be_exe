# Backend Express.js + MongoDB

Backend application với kiến trúc **Model - Repository - Service - Controller**

## 🏗️ Cấu trúc project

```
src/
├── config/              # Cấu hình
│   ├── database.js      # Kết nối MongoDB
│   └── env.js           # Biến môi trường
│
├── models/              # Mongoose Models
│   └── user.model.js
│
├── repositories/        # Data Access Layer
│   └── user.repository.js
│
├── services/            # Business Logic Layer
│   ├── user.service.js
│   └── auth.service.js
│
├── controllers/         # HTTP Layer
│   ├── user.controller.js
│   └── auth.controller.js
│
├── routes/              # Route definitions
│   ├── index.js
│   ├── user.route.js
│   └── auth.route.js
│
├── middlewares/         # Express middlewares
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   └── validation.middleware.js
│
├── utils/               # Utilities
│   ├── hash.js
│   ├── jwt.js
│   └── response.js
│
├── app.js               # Express app setup
└── server.js            # Server entry point
```

## 🔄 Luồng xử lý

```
HTTP Request → Route → Controller → Service → Repository → Model (MongoDB)
```

## 🚀 Cài đặt

### 1. Cài dependencies

```bash
npm install
```

### 2. Tạo file .env

```bash
cp .env.example .env
```

Sau đó cập nhật các giá trị trong file `.env`

### 3. Chạy MongoDB

Đảm bảo MongoDB đang chạy trên máy hoặc cập nhật `MONGO_URI` trong `.env`

### 4. Khởi động server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

## 📡 API Endpoints

### Authentication

- `POST /api/v1/auth/login` - Đăng nhập
- `GET /api/v1/auth/me` - Lấy thông tin user hiện tại (cần auth)
- `POST /api/v1/auth/change-password` - Đổi mật khẩu (cần auth)
- `POST /api/v1/auth/logout` - Đăng xuất (cần auth)

### Users

- `POST /api/v1/users` - Tạo user mới
- `GET /api/v1/users` - Lấy danh sách users (Admin only)
- `GET /api/v1/users/:id` - Lấy user theo ID (Admin only)
- `PUT /api/v1/users/:id` - Cập nhật user (Admin only)
- `DELETE /api/v1/users/:id` - Xóa user (Admin only)
- `GET /api/v1/users/me` - Lấy profile (cần auth)
- `PUT /api/v1/users/me` - Cập nhật profile (cần auth)

### Health Check

- `GET /health` - Kiểm tra server status

## 🔐 Authentication

API sử dụng JWT Bearer token:

```
Authorization: Bearer <your-token>
```

## 📦 Dependencies chính

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **bcrypt** - Mã hóa password
- **jsonwebtoken** - JWT authentication
- **dotenv** - Environment variables

## 🛡️ Security

- Password được hash bằng bcrypt
- JWT token cho authentication
- Role-based authorization (USER, ADMIN)
- Input validation middleware
- Error handling middleware

## 📝 Ví dụ sử dụng

### Tạo user mới

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Lấy profile (với token)

```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <your-token>"
```

## 🧪 Testing

(Chưa có test - có thể thêm Jest/Mocha sau)

## 📄 License

ISC
