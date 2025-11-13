/**
 * VNPay Routes
 */

import express from 'express';
import vnpayController from '../controllers/vnpayController.js';

const router = express.Router();

// Tạo URL thanh toán VNPay
router.post('/create_payment_url', vnpayController.createPaymentUrl);

// Xử lý callback từ VNPay (return URL)
router.get('/vnpay_return', vnpayController.vnpayReturn);

// IPN callback từ VNPay
router.get('/vnpay_ipn', vnpayController.vnpayIPN);

export default router;
