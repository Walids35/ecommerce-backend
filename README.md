# E-Commerce Back Office - Backend API

A robust Node.js backend application for an e-commerce back office system built with TypeScript, Express, and PostgreSQL.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Development Status](#development-status)
- [Contributing](#contributing)

## ✨ Features

### ✅ Completed Features

- **Authentication System**
  - User registration and login
  - JWT token-based authentication
  - Password hashing with bcrypt
  - Cookie-based session management
  - Admin and superadmin role management

- **Database Integration**
  - PostgreSQL database with Drizzle ORM
  - User schema with role-based access
  - Database migrations
  - Automatic admin user seeding

- **Security & Middleware**
  - CORS configuration
  - Error handling middleware
  - Input validation
  - Environment-based configuration

- **Development Setup**
  - TypeScript configuration
  - Hot reloading with development server
  - Comprehensive error handling
  - Git integration with proper .gitignore

### 🚧 In Progress Features

- **User Management**
  - User CRUD operations
  - User profile management
  - Role-based permissions

### 📋 Planned Features (Based on Requirements)

#### Product Management
- [ ] Product CRUD operations
- [ ] Category management
- [ ] Inventory tracking
- [ ] Product image management
- [ ] Bulk product import/export
- [ ] Product variants and attributes

#### Order Management
- [ ] Order processing and status tracking
- [ ] Order history and analytics
- [ ] Invoice generation
- [ ] Shipping management
- [ ] Return and refund processing

#### Analytics & Reporting
- [ ] Sales analytics dashboard
- [ ] Revenue reporting
- [ ] Inventory analytics
- [ ] Customer behavior analytics
- [ ] Export capabilities (PDF, Excel)

#### Advanced Features
- [ ] Multi-language support
- [ ] Email notification system
- [ ] Audit logging
- [ ] API rate limiting
- [ ] Advanced search and filtering
- [ ] Backup and restore functionality

## 🛠 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt
- **Environment:** dotenv
- **Development:** tsx (TypeScript execution)

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm

## 🚀 Installation

1. **Clone the repository:**
   ```bash
   git clone ...
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## ⚙️ Configuration

1. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables in `.env`:**
   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/ecommerce_db

   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=24h

   # Server
   PORT=3000
   NODE_ENV=development
   ```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The server will start on `http://localhost:4000` (or the port specified in your .env file).

### Default Admin User
When the application starts, it automatically creates an admin user:
- **Email:** `admin@gmail.com`
- **Password:** `admin2025`
- **Role:** `admin`

## 📚 API Documentation

POSTMAN LINK: https://sialawalid9-8101584.postman.co/workspace/Walid-Siala's-Workspace~631ac276-fac5-4486-8735-a4a451caf607/collection/50095119-8bdd2f72-9e08-40b5-98d7-5b5f935a6409?action=share&source=copy-link&creator=50095119

## 🗄️Database Schema
https://app.eraser.io/workspace/Xlt2x7l9kLOUULImBEcx?origin=share

## 📁 Project Structure

```
backend/
├── src/
│   ├── index.ts                 # Application entry point
│   ├── db/
│   │   ├── data-source.ts       # Database connection
│   │   ├── database-seeding.ts  # Database seeding
│   │   └── schema/
│   │       └── users.ts         # User schema definition
│   ├── drizzle/                 # Generated migrations
│   │   ├── 0000_clumsy_pete_wisdom.sql
│   │   └── meta/
│   ├── middlewares/
│   │   ├── errorHandler.ts     # Global error handler
│   │   └── notFound.ts         # 404 handler
│   ├── modules/
│   │   ├── auth/               # Authentication module
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.utils.ts
│   │   │   └── dto/
│   │   │       └── login.dto.ts
│   │   └── user/               # User management module
│   │       ├── user.controller.ts
│   │       ├── user.routes.ts
│   │       ├── user.service.ts
│   │       └── dto/
│   └── utils/
│       └── format.ts           # Utility functions
├── .env                        # Environment variables
├── .gitignore                 # Git ignore rules
├── drizzle.config.ts          # Drizzle ORM configuration
├── package.json               # Project dependencies
└── tsconfig.json             # TypeScript configuration
```

## 🔧 Development Status

### Current Sprint: Authentication & User Management ✅
- ✅ Basic authentication system
- ✅ JWT token management
- ✅ Database setup and migrations
- ✅ Error handling and validation
- ✅ Admin user seeding
- 🚧 User CRUD operations
- 📋 Role-based access control

### Next Sprint: Product Management 📋
- 📋 Product schema design
- 📋 Product CRUD operations
- 📋 Category management
- 📋 Image upload handling

### Future Sprints 📋
- 📋 Order management system
- 📋 Analytics and reporting
- 📋 Email notifications
- 📋 Advanced security features

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start           # Start production server

# Database
npm run db:generate  # Generate new migrations
npm run db:push     # Push schema changes to database
```

## 🔒 Security Features

- **JWT Authentication:** Secure token-based authentication
- **Password Hashing:** bcrypt with salt rounds
- **CORS Protection:** Configured for frontend integration
- **Environment Variables:** Sensitive data protection
- **Input Validation:** Request validation and sanitization
- **Error Handling:** Comprehensive error management

## 📊 Monitoring and Logging

- Request/response logging
- Error tracking
- Performance monitoring (planned)
- Health check endpoints

## 📈 Performance

- Response time targets: < 200ms for most endpoints
- Database query optimization with Drizzle ORM
- Efficient JWT token management
- Connection pooling for database

---

**Last Updated:** 11th November 2025  
**Version:** 1.0.0  
**Status:** In Development  
**License:** MIT