import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';
import authRoutes from './modules/auth/auth.routes';
import categoryRoutes from './modules/categories/category.routes';
import subCategoryRoutes from './modules/subcategory/subcategory.routes';
import subSubCategoryRoutes from './modules/subsubcategory/subsubcategory.routes';
import attributeRoutes from './modules/attributes/attribute.routes';
import productRoutes from './modules/product/product.routes';
import fileUploadRoutes from './modules/file-upload/file-upload.route';
import checkoutRoutes from './modules/checkout/checkout.routes';
import orderRoutes from './modules/order/order.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import collectionRoutes from './modules/collection/collection.routes';
import { seedDatabase } from './db/database-seeding';
import cookieParser from 'cookie-parser';
import { verifyJWT } from "./middlewares/auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ 
  limit: '50mb', 
  extended: true,
  parameterLimit: 50000 
}));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', verifyJWT, orderRoutes);
app.use("/api/categories", categoryRoutes)
app.use("/api/subcategories", subCategoryRoutes);
app.use("/api/subsubcategories", subSubCategoryRoutes);
app.use('/api/attributes', attributeRoutes);
app.use("/api/products", productRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/file-upload', verifyJWT, fileUploadRoutes);
app.use('/api/analytics', verifyJWT, analyticsRoutes);

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