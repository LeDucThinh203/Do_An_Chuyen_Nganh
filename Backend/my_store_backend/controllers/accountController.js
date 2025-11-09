import * as accountRepo from '../repositories/accountRepository.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

/** ================= Đăng ký tài khoản ================= */
export const register = async (req, res) => {
  const { email, username, password, role } = req.body;
  if (!email || !username || !password)
    return res.status(400).json({ error: 'Email, username và password là bắt buộc' });

  try {
    const existing = await accountRepo.getAccountByEmail(email);
    if (existing) return res.status(400).json({ error: 'Email đã tồn tại' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = await accountRepo.createAccount({ email, username, password: hashedPassword, role: role || 'user' });

    res.status(201).json({ id, email, username, role: role || 'user' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/** ================= Đăng nhập ================= */
export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email và password là bắt buộc' });

  try {
    const account = await accountRepo.getAccountByEmail(email);
    if (!account) return res.status(400).json({ error: 'Email không tồn tại' });

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) return res.status(400).json({ error: 'Mật khẩu không đúng' });

    // Trả về email để frontend lưu vào session
    res.json({
      id: account.id,
      username: account.username,
      role: account.role,
      email: account.email
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/** ================= Lấy tất cả tài khoản ================= */
export const getAllAccounts = async (req, res) => {
  try {
    const accounts = await accountRepo.getAllAccounts();
    res.json(accounts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/** ================= Lấy account theo ID ================= */
export const getAccountById = async (req, res) => {
  try {
    const account = await accountRepo.getAccountById(req.params.id);
    res.json(account);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/** ================= Cập nhật account ================= */
export const updateAccount = async (req, res) => {
  try {
    await accountRepo.updateAccount(req.params.id, req.body);
    res.json({ message: 'Cập nhật thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/** ================= Xóa account ================= */
export const deleteAccount = async (req, res) => {
  try {
    await accountRepo.deleteAccount(req.params.id);
    res.json({ message: 'Xóa thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/** ================= Quên mật khẩu ================= */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Vui lòng nhập email' });

  try {
    const account = await accountRepo.getAccountByEmail(email);
    if (!account) return res.status(404).json({ error: 'Email không tồn tại' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiryDate = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

    await accountRepo.saveResetToken(account.id, token, expiryDate);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const resetLink = `http://localhost:3000/reset-password/${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Khôi phục mật khẩu CoolShop',
      html: `<p>Nhấn <a href="${resetLink}">vào đây</a> để đặt lại mật khẩu.</p>`,
    });

    res.json({ message: 'Email khôi phục mật khẩu đã gửi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/** ================= Đặt lại mật khẩu ================= */
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!token || !newPassword)
    return res.status(400).json({ error: 'Token và mật khẩu mới là bắt buộc' });

  try {
    const account = await accountRepo.getAccountByResetToken(token);
    if (!account) return res.status(400).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });

    if (new Date() > new Date(account.reset_token_expiry))
      return res.status(400).json({ error: 'Token đã hết hạn' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await accountRepo.updateAccountPassword(account.id, hashed);

    res.json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
