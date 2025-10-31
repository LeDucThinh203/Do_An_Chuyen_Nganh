import express from 'express';
import * as ratingController from '../controllers/ratingController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Rating
 *     description: API quản lý đánh giá sản phẩm
 */

/**
 * @swagger
 * /rating:
 *   get:
 *     summary: Lấy tất cả đánh giá
 *     tags: [Rating]
 *     responses:
 *       200:
 *         description: Danh sách đánh giá
 */
router.get('/', ratingController.getAllRatings);

/**
 * @swagger
 * /rating/{id}:
 *   get:
 *     summary: Lấy đánh giá theo ID
 *     tags: [Rating]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID đánh giá
 *     responses:
 *       200:
 *         description: Thông tin đánh giá
 */
router.get('/:id', ratingController.getRatingById);

/**
 * @swagger
 * /rating:
 *   post:
 *     summary: Tạo đánh giá mới
 *     tags: [Rating]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating_value:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *               order_detail_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Tạo đánh giá thành công
 */
router.post('/', ratingController.createRating);

/**
 * @swagger
 * /rating/{id}:
 *   put:
 *     summary: Cập nhật đánh giá
 *     tags: [Rating]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID đánh giá
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating_value:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *               order_detail_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id', ratingController.updateRating);

/**
 * @swagger
 * /rating/{id}:
 *   delete:
 *     summary: Xóa đánh giá
 *     tags: [Rating]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID đánh giá
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/:id', ratingController.deleteRating);

export default router;
