import express from 'express';
import * as ordersController from '../controllers/ordersController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: API quản lý đơn hàng
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Lấy tất cả đơn hàng
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng
 */
router.get('/', ordersController.getAllOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Lấy đơn hàng theo ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID đơn hàng
 *     responses:
 *       200:
 *         description: Thông tin đơn hàng
 */
router.get('/:id', ordersController.getOrderById);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Tạo đơn hàng mới
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               account_id:
 *                 type: integer
 *               total_amount:
 *                 type: number
 *               payment_method:
 *                 type: string
 *               is_paid:
 *                 type: boolean
 *               order_details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_sizes_id:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     price:
 *                       type: number
 *     responses:
 *       201:
 *         description: Đơn hàng được tạo
 */
router.post('/', ordersController.createOrder);

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Cập nhật trạng thái đơn hàng (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID đơn hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               is_paid:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền admin
 */
router.put('/:id', authenticate, requireAdmin, ordersController.updateOrderStatus);

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Xóa đơn hàng (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID đơn hàng
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền hủy đơn hàng hoặc đơn hàng không ở trạng thái pending
 */
router.delete('/:id', authenticate, ordersController.deleteOrder);

export default router;
