// routes/ui.js
import express from 'express';

import accountRoutes from './account.js';
import addressRoutes from './address.js';
import categoryRoutes from './category.js';
import productRoutes from './product.js';
import productSizesRoutes from './product_sizes.js';
import ordersRoutes from './orders.js';
import orderDetailsRoutes from './order_details.js';
import ratingRoutes from './rating.js';
import sizesRoutes from './sizes.js';
import aiRoutes from './ai.js';

const router = express.Router();

// Mount tất cả route vào đây
router.use('/account', accountRoutes);
router.use('/address', addressRoutes);
router.use('/category', categoryRoutes);
router.use('/product', productRoutes);
router.use('/product_sizes', productSizesRoutes);
router.use('/orders', ordersRoutes);
router.use('/order_details', orderDetailsRoutes);
router.use('/rating', ratingRoutes);
router.use('/sizes', sizesRoutes);
router.use('/ai', aiRoutes);

export default router;
