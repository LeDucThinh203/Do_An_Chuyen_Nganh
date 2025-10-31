import express from 'express';
import * as productSizesController from '../controllers/productSizesController.js';

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
 *     summary: Tạo product_size mới
 *     tags: [ProductSize]
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
 *     responses:
 *       201:
 *         description: Tạo product_size thành công
 */
router.post('/', productSizesController.createProductSize);

/**
 * @swagger
 * /product_sizes/{id}:
 *   put:
 *     summary: Cập nhật product_size
 *     tags: [ProductSize]
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
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id', productSizesController.updateProductSize);

/**
 * @swagger
 * /product_sizes/{id}:
 *   delete:
 *     summary: Xóa product_size
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
 *         description: Xóa thành công
 */
router.delete('/:id', productSizesController.deleteProductSize);

export default router;
