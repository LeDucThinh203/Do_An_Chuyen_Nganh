import express from 'express';
import * as categoryController from '../controllers/categoryController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Category
 *     description: API quản lý danh mục sản phẩm
 */

/**
 * @swagger
 * /category:
 *   get:
 *     summary: Lấy tất cả danh mục
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: Danh sách danh mục
 */
router.get('/', categoryController.getAllCategories);

/**
 * @swagger
 * /category/{id}:
 *   get:
 *     summary: Lấy danh mục theo ID
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Thông tin danh mục
 */
router.get('/:id', categoryController.getCategoryById);

/**
 * @swagger
 * /category:
 *   post:
 *     summary: Tạo danh mục mới
 *     tags: [Category]
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
 *     responses:
 *       201:
 *         description: Tạo danh mục thành công
 */
router.post('/', categoryController.createCategory);

/**
 * @swagger
 * /category/{id}:
 *   put:
 *     summary: Cập nhật danh mục
 *     tags: [Category]
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
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id', categoryController.updateCategory);

/**
 * @swagger
 * /category/{id}:
 *   delete:
 *     summary: Xóa danh mục
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/:id', categoryController.deleteCategory);

export default router;
