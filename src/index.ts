import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';
import authRoutes from './modules/auth/auth.routes';
import categoryRoutes from './modules/categories/category.routes';
import subCategoryRoutes from './modules/subcategory/subcategory.routes';
import subCategoryAttributeRoutes from './modules/subcategory/attributes/subcategory-attribute.routes';
import productRoutes from './modules/product/product.routes';
import { seedDatabase } from './db/database-seeding';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use("/api/categories", categoryRoutes)
app.use("/api/subcategories", subCategoryRoutes);
app.use('/api/subcategory-attributes', subCategoryAttributeRoutes);
app.use("/api/products", productRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' })
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  try {
    await seedDatabase();
    console.log('Database seeding completed');
  } catch (error) {
    console.error('Database seeding failed:', error)
  }
});