import * as accountRepo from '../repositories/accountRepository.js';
import bcrypt from 'bcryptjs';

/** Đăng ký tài khoản */
export const register = async (req, res) => {
  const { email, username, password, role } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username và password là bắt buộc' });
  }

  try {
    const existing = await accountRepo.getAccountByEmail(email);
    if (existing) return res.status(400).json({ error: 'Email đã tồn tại' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const id = await accountRepo.createAccount({
      email,
      username,
      password: hashedPassword,
      role: role || 'user',
    });

    res.status(201).json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/** Đăng nhập */
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email và password là bắt buộc' });
  }

  try {
    const account = await accountRepo.getAccountByEmail(email);
    if (!account) return res.status(400).json({ error: 'Email không tồn tại' });

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) return res.status(400).json({ error: 'Mật khẩu không đúng' });

    res.json({ id: account.id, username: account.username, role: account.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/** Lấy tất cả tài khoản */
export const getAllAccounts = async (req, res) => {
  try {
    const accounts = await accountRepo.getAllAccounts();
    res.json(accounts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/** Lấy account theo ID */
export const getAccountById = async (req, res) => {
  try {
    const account = await accountRepo.getAccountById(req.params.id);
    res.json(account);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/** Cập nhật account */
export const updateAccount = async (req, res) => {
  try {
    await accountRepo.updateAccount(req.params.id, req.body);
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/** Xóa account */
export const deleteAccount = async (req, res) => {
  try {
    await accountRepo.deleteAccount(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
