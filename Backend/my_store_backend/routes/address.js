import express from 'express';
import * as addressController from '../controllers/addressController.js';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Address
 *     description: API quản lý địa chỉ
 */

/**
 * @swagger
 * /address:
 *   get:
 *     summary: Lấy tất cả địa chỉ
 *     tags: [Address]
 *     responses:
 *       200:
 *         description: Danh sách địa chỉ
 */
router.get('/', addressController.getAllAddresses);

/**
 * @swagger
 * /address/{id}:
 *   get:
 *     summary: Lấy địa chỉ theo ID
 *     tags: [Address]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Thông tin địa chỉ
 */
router.get('/:id', addressController.getAddressById);

/**
 * @swagger
 * /address:
 *   post:
 *     summary: Tạo địa chỉ mới
 *     tags: [Address]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account_id:
 *                 type: integer
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               provinceName:
 *                 type: string
 *               districtName:
 *                 type: string
 *               wardName:
 *                 type: string
 *               address_detail:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo địa chỉ thành công
 */
router.post('/', addressController.createAddress);

/**
 * @swagger
 * /address/{id}:
 *   put:
 *     summary: Cập nhật địa chỉ
 *     tags: [Address]
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
 *               account_id:
 *                 type: integer
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               provinceName:
 *                 type: string
 *               districtName:
 *                 type: string
 *               wardName:
 *                 type: string
 *               address_detail:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id', addressController.updateAddress);

/**
 * @swagger
 * /address/{id}:
 *   delete:
 *     summary: Xóa địa chỉ
 *     tags: [Address]
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
router.delete('/:id', addressController.deleteAddress);

export default router;
