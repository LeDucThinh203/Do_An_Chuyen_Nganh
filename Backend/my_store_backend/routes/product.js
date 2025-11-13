import express from 'express';
import * as productController from '../controllers/productController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Product
 *     description: API quản lý sản phẩm
 */

/**
 * @swagger
 * /product:
 *   get:
 *     summary: Lấy tất cả sản phẩm
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm
 */
router.get('/', productController.getAllProducts);

/**
 * @swagger
 * /product/{id}:
 *   get:
 *     summary: Lấy sản phẩm theo ID
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID sản phẩm
 *     responses:
 *       200:
 *         description: Thông tin sản phẩm
 */
router.get('/:id', productController.getProductById);

/**
 * @swagger
 * /product:
 *   post:
 *     summary: Tạo sản phẩm mới (Admin only)
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               image:
 *                 type: string
 *               category_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền admin
 */
router.post('/', authenticate, requireAdmin, productController.createProduct);

/**
 * @swagger
 * /product/{id}:
 *   put:
 *     summary: Cập nhật sản phẩm (Admin only)
 *     tags: [Product]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               image:
 *                 type: string
 *               category_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền admin
 */
router.put('/:id', authenticate, requireAdmin, productController.updateProduct);

/**
 * @swagger
 * /product/{id}:
 *   delete:
 *     summary: Xóa sản phẩm (Admin only)
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID sản phẩm
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền admin
 */
router.delete('/:id', authenticate, requireAdmin, productController.deleteProduct);

export default router;
