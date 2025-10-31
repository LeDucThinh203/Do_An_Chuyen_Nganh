import express from 'express';
import * as orderDetailsController from '../controllers/orderDetailsController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: OrderDetails
 *     description: API quản lý chi tiết đơn hàng
 */

/**
 * @swagger
 * /order_details:
 *   get:
 *     summary: Lấy tất cả chi tiết đơn hàng
 *     tags: [OrderDetails]
 *     responses:
 *       200:
 *         description: Danh sách chi tiết đơn hàng
 */
router.get('/', orderDetailsController.getAllOrderDetails);

/**
 * @swagger
 * /order_details/{id}:
 *   get:
 *     summary: Lấy chi tiết đơn hàng theo ID
 *     tags: [OrderDetails]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID chi tiết đơn hàng
 *     responses:
 *       200:
 *         description: Thông tin chi tiết đơn hàng
 */
router.get('/:id', orderDetailsController.getOrderDetailById);

/**
 * @swagger
 * /order_details:
 *   post:
 *     summary: Tạo chi tiết đơn hàng mới
 *     tags: [OrderDetails]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order_id:
 *                 type: integer
 *               product_sizes_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Tạo chi tiết đơn hàng thành công
 */
router.post('/', orderDetailsController.createOrderDetail);

/**
 * @swagger
 * /order_details/{id}:
 *   put:
 *     summary: Cập nhật chi tiết đơn hàng
 *     tags: [OrderDetails]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID chi tiết đơn hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order_id:
 *                 type: integer
 *               product_sizes_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id', orderDetailsController.updateOrderDetail);

/**
 * @swagger
 * /order_details/{id}:
 *   delete:
 *     summary: Xóa chi tiết đơn hàng
 *     tags: [OrderDetails]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID chi tiết đơn hàng
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/:id', orderDetailsController.deleteOrderDetail);

export default router;
