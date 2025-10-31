import express from 'express';
import * as sizeController from '../controllers/sizeController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Sizes
 *     description: API quản lý sizes
 */

/**
 * @swagger
 * /sizes:
 *   get:
 *     summary: Lấy tất cả sizes
 *     tags: [Sizes]
 *     responses:
 *       200:
 *         description: Danh sách sizes
 */
router.get('/', sizeController.getAllSizes);

/**
 * @swagger
 * /sizes/{id}:
 *   get:
 *     summary: Lấy size theo ID
 *     tags: [Sizes]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID size
 *     responses:
 *       200:
 *         description: Thông tin size
 */
router.get('/:id', sizeController.getSizeById);

/**
 * @swagger
 * /sizes:
 *   post:
 *     summary: Tạo size mới
 *     tags: [Sizes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               size:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo size thành công
 */
router.post('/', sizeController.createSize);

/**
 * @swagger
 * /sizes/{id}:
 *   put:
 *     summary: Cập nhật size
 *     tags: [Sizes]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID size
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               size:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id', sizeController.updateSize);

/**
 * @swagger
 * /sizes/{id}:
 *   delete:
 *     summary: Xóa size
 *     tags: [Sizes]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID size
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/:id', sizeController.deleteSize);

export default router;
