import express from 'express';
import * as accountController from '../controllers/accountController.js';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Account
 *     description: API quản lý tài khoản
 */

/**
 * @swagger
 * /account:
 *   get:
 *     summary: Lấy tất cả tài khoản
 *     tags: [Account]
 *     responses:
 *       200:
 *         description: Danh sách tài khoản
 */
router.get('/', accountController.getAllAccounts);

/**
 * @swagger
 * /account/{id}:
 *   get:
 *     summary: Lấy tài khoản theo ID
 *     tags: [Account]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Thông tin tài khoản
 */
router.get('/:id', accountController.getAccountById);

/**
 * @swagger
 * /account:
 *   post:
 *     summary: Tạo tài khoản mới
 *     tags: [Account]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo tài khoản thành công
 */
router.post('/', accountController.createAccount);

/**
 * @swagger
 * /account/{id}:
 *   put:
 *     summary: Cập nhật tài khoản
 *     tags: [Account]
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
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id', accountController.updateAccount);

/**
 * @swagger
 * /account/{id}:
 *   delete:
 *     summary: Xóa tài khoản
 *     tags: [Account]
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
router.delete('/:id', accountController.deleteAccount);

export default router;
