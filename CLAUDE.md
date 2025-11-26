# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
- `npm run dev` - Start development server with hot reload using nodemon
- `npm run build` - Compile TypeScript to JavaScript (output in `dist/`)
- `npm start` - Run production build from `dist/index.js`

### Database Operations
- `npm run db:generate` - Generate new Drizzle ORM migrations from schema changes
- `npm run db:push` - Push schema changes directly to PostgreSQL database without generating migration files

## Environment Configuration

Required environment variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `JWT_EXPIRES_IN` - JWT token expiration time (e.g., "24h")
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend origin for CORS (defaults to http://localhost:5173)
- `PORT` - Server port (defaults to 3000)

## Architecture Overview

### Module-Based Structure
The application follows a modular architecture where each feature domain is organized in `src/modules/`. Each module contains:
- `*.controller.ts` - Request/response handling
- `*.service.ts` - Business logic and database operations
- `*.routes.ts` - Express route definitions
- `dto/*.dto.ts` - Zod validation schemas for request/response data

### Database Architecture (Drizzle ORM)
Database schemas are defined in `src/db/schema/` using Drizzle ORM with PostgreSQL:
- Schema files define tables and relations
- All migrations generated in `src/drizzle/`
- Database connection managed in `src/db/data-source.ts`
- Automatic admin user seeding on startup (defined in `src/db/database-seeding.ts`)

### Product Data Model
The application uses a flexible attribute system for products:
- **Categories** → **Subcategories** → **Products**
- Each subcategory can define custom **attributes** (e.g., "Color", "Size")
- Each attribute has multiple predefined **attribute values** (e.g., "Red", "Blue")
- Products are linked to specific attribute values through `product_attribute_values` junction table
- This allows different subcategories to have different product specifications without schema changes

Example: Electronics subcategory might have attributes like "Screen Size" and "RAM", while Clothing has "Size" and "Color".

### Authentication Flow
- JWT tokens stored in HTTP-only cookies
- `verifyJWT` middleware (src/middlewares/auth.ts) protects routes
- All API routes except `/api/auth/*` require authentication
- User roles: "admin" and "support" (enum defined in user schema)

### File Upload System
- Uses Firebase Storage for file uploads
- Firebase configuration in `src/db/firebase.ts`
- Multer middleware for handling multipart/form-data (src/middlewares/upload.ts)
- File upload routes at `/api/file-upload`

## API Structure

Base URL: `http://localhost:3000` (or configured PORT)

Routes are prefixed as follows:
- `/api/auth` - Authentication (login, register) - **No JWT required**
- `/api/categories` - Category CRUD
- `/api/subcategories` - Subcategory CRUD
- `/api/subcategory-attributes` - Manage attributes and values for subcategories
- `/api/products` - Product CRUD with attribute values
- `/api/file-upload` - File upload to Firebase Storage
- `/health` - Health check endpoint

All routes except `/api/auth/*` and `/health` require JWT token in cookies.

## Database Schema Relationships

```
categories (id, name, description)
  └── sub_categories (id, name, category_id)
      ├── sub_category_attributes (id, sub_category_id, name)
      │   └── sub_category_attribute_values (id, attribute_id, value)
      │       └── product_attribute_values (product_id, attribute_id, attribute_value_id)
      └── products (id, name, price, stock, images, sub_category_id)
          └── product_attribute_values (links products to specific attribute values)

user (id, email, password, name, role)
```

## Key Implementation Patterns

### Service Layer Pattern
- Controllers delegate to service classes for business logic
- Services handle database queries using Drizzle ORM
- Example: `ProductService` in `src/modules/product/product.service.ts` contains methods like `create()`, `findAll()`, `findById()`, `update()`, `delete()`

### Request Validation
- Use Zod schemas defined in `dto/*.dto.ts` files
- Validation happens in controller layer before passing to service

### Error Handling
- Centralized error handler middleware in `src/middlewares/errorHandler.ts`
- Services throw errors with messages; middleware catches and formats response
- 404 handler in `src/middlewares/notFound.ts` for undefined routes

### CORS Configuration
- Configured to accept requests from `FRONTEND_URL` environment variable
- Credentials enabled for cookie-based auth

## Default Admin Credentials
The system automatically seeds an admin user on startup:
- Email: `admin@gmail.com`
- Password: `admin2025`
- Role: `admin`

## API Documentation
Postman collection: https://sialawalid9-8101584.postman.co/workspace/Walid-Siala's-Workspace~631ac276-fac5-4486-8735-a4a451caf607/collection/50095119-8bdd2f72-9e08-40b5-98d7-5b5f935a6409

Database schema diagram: https://app.eraser.io/workspace/Xlt2x7l9kLOUULImBEcx?origin=share

## TypeScript Configuration
- Target: ES2020
- Module: CommonJS
- Strict mode enabled
- Experimental decorators enabled
- Output directory: `dist/`
- For each module, it must have a controller file, service file, route file and dto folder.