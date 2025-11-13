import express from 'express';
import * as productSizesController from '../controllers/productSizesController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: ProductSize
 *     description: API quản lý product_size
 */

/**
 * @swagger
 * /product_sizes:
 *   get:
 *     summary: Lấy tất cả product_size
 *     tags: [ProductSize]
 *     responses:
 *       200:
 *         description: Danh sách product_size
 */
router.get('/', productSizesController.getAllProductSizes);

/**
 * @swagger
 * /product_sizes/{id}:
 *   get:
 *     summary: Lấy product_size theo ID
 *     tags: [ProductSize]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID product_size
 *     responses:
 *       200:
 *         description: Thông tin product_size
 */
router.get('/:id', productSizesController.getProductSizeById);

/**
 * @swagger
 * /product_sizes:
 *   post:
 *     summary: Tạo product_size mới (Admin only)
 *     tags: [ProductSize]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: integer
 *               size_id:
 *                 type: integer
 *               warehouse:
 *                 type: integer
 *                 description: Số lượng trong kho
 *     responses:
 *       201:
 *         description: Tạo product_size thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền admin
 */
router.post('/', authenticate, requireAdmin, productSizesController.createProductSize);

/**
 * @swagger
 * /product_sizes/{id}:
 *   put:
 *     summary: Cập nhật product_size (Admin only)
 *     tags: [ProductSize]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: integer
 *               size_id:
 *                 type: integer
 *               warehouse:
 *                 type: integer
 *                 description: Số lượng trong kho
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền admin
 */
router.put('/:id', authenticate, requireAdmin, productSizesController.updateProductSize);

/**
 * @swagger
 * /product_sizes/{id}:
 *   delete:
 *     summary: Xóa product_size (Admin only)
 *     tags: [ProductSize]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID product_size
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền admin
 */
router.delete('/:id', authenticate, requireAdmin, productSizesController.deleteProductSize);

export default router;
