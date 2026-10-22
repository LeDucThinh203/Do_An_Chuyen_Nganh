import express from 'express';
import * as cartController from '../controllers/cartController.js';
import { authenticate, requireUser } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate, requireUser);

router.get('/', cartController.getMyCart);
router.post('/items', cartController.addCartItem);
router.patch('/items/:productSizesId', cartController.updateCartItem);
router.delete('/items/:productSizesId', cartController.removeCartItem);
router.delete('/', cartController.clearMyCart);
router.post('/merge', cartController.mergeGuestCart);

export default router;
