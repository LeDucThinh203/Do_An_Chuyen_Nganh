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
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Kích thước trang; bật phản hồi phân trang dạng data/pagination
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor opaque nhận từ trang trước
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: Lọc theo danh mục khi phân trang
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm
 */
router.get('/', productController.getAllProducts);
router.get('/storefront', productController.getStorefrontPage);

/**
 * @swagger
 * /product/admin/all:
 *   get:
 *     summary: Lấy tất cả sản phẩm gồm cả đã ẩn (Admin only)
 *     tags: [Product]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm đầy đủ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền admin
 */
router.get('/admin/all', authenticate, requireAdmin, productController.getAllProductsAdmin);

router.get('/:id/ratings', productController.getProductRatings);
router.get('/:id/rating-eligibility', authenticate, productController.getProductRatingEligibility);
router.get('/:id/details', productController.getProductDetails);

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
 *       - cookieAuth: []
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
 *       - cookieAuth: []
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
 *       - cookieAuth: []
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

/**
 * @swagger
 * /product/{id}/restore:
 *   patch:
 *     summary: Khôi phục sản phẩm đã ẩn (Admin only)
 *     tags: [Product]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID sản phẩm
 *     responses:
 *       200:
 *         description: Khôi phục thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền admin
 */
router.patch('/:id/restore', authenticate, requireAdmin, productController.restoreProduct);

/**
 * @swagger
 * /product/{id}/hard-delete:
 *   delete:
 *     summary: Xóa cứng sản phẩm (chỉ cho sản phẩm chưa được mua)
 *     tags: [Product]
 *     security:
 *       - cookieAuth: []
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
 *       409:
 *         description: Sản phẩm đã được mua, không thể xóa
 */
router.delete('/:id/hard-delete', authenticate, requireAdmin, productController.hardDeleteProduct);

export default router;
