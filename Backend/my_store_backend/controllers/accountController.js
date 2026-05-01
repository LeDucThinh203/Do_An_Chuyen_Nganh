import * as accountRepo from '../repositories/accountRepository.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { generateToken } from '../middleware/auth.js';

const getEmailAuthConfig = () => {
  const user = String(process.env.EMAIL_USER || '').trim();
  // Gmail app password is often copied with spaces every 4 chars.
  const pass = String(process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  if (!user || !pass) return null;
  return { user, pass };
};

const getSendGridConfig = () => {
  const apiKey = String(process.env.SENDGRID_API_KEY || '').trim();
  const from = String(process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER || '').trim();
  const replyTo = String(process.env.SENDGRID_REPLY_TO || '').trim();
  const unsubscribe = String(process.env.SENDGRID_UNSUBSCRIBE_EMAIL || '').trim();
  if (!apiKey || !from) return null;
  return { apiKey, from, replyTo: replyTo || undefined, unsubscribe: unsubscribe || undefined };
};

const normalizeRecipients = (to) => {
  if (Array.isArray(to)) {
    return to
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .map((email) => ({ email }));
  }

  const single = String(to || '').trim();
  return single ? [{ email: single }] : [];
};

const sendMailWithSendGrid = async ({ mailOptions, context }) => {
  const sendGrid = getSendGridConfig();
  if (!sendGrid) return false;

  const recipients = normalizeRecipients(mailOptions.to);
  if (!recipients.length) {
    const err = new Error('No recipients for SendGrid');
    err.code = 'SENDGRID_NO_RECIPIENTS';
    throw err;
  }

  const html = String(mailOptions.html || '');
  const text = String(mailOptions.text || (html ? html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : ''));

  const personalizations = [{ to: recipients }];
  if (sendGrid.unsubscribe) {
    personalizations[0].headers = { 'List-Unsubscribe': `mailto:${sendGrid.unsubscribe}` };
  }

  const payload = {
    personalizations,
    from: { email: sendGrid.from },
    subject: String(mailOptions.subject || ''),
    content: [
      { type: 'text/plain', value: text },
      { type: 'text/html', value: html },
    ],
  };

  if (sendGrid.replyTo) payload.reply_to = { email: sendGrid.replyTo };

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sendGrid.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    const err = new Error(`SendGrid failed (${response.status}): ${detail}`);
    err.code = `SENDGRID_${response.status}`;
    throw err;
  }

  console.log(`[Mail][${context}] Sent via SendGrid API`);
  return true;
};

const parseBoolEnv = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const getSmtpConfigs = () => {
  const smtpHost = String(process.env.SMTP_HOST || '').trim();
  const smtpPortRaw = String(process.env.SMTP_PORT || '').trim();
  const smtpSecureEnv = parseBoolEnv(process.env.SMTP_SECURE);

  const configs = [];
  const seen = new Set();
  const addConfig = ({ host, port, secure, label }) => {
    const key = `${host}:${port}:${secure}`;
    if (seen.has(key)) return;
    seen.add(key);
    configs.push({ host, port, secure, label });
  };

  if (smtpHost || smtpPortRaw) {
    const host = smtpHost || 'smtp.gmail.com';
    const port = Number(smtpPortRaw) || 587;
    addConfig({
      host,
      port,
      secure: smtpSecureEnv ?? port === 465,
      label: 'custom',
    });

    // Keep Gmail fallback even when custom env is set, because some runtimes block 465 or 587 intermittently.
    if (host.toLowerCase() === 'smtp.gmail.com') {
      addConfig({ host: 'smtp.gmail.com', port: 465, secure: true, label: 'gmail-465' });
      addConfig({ host: 'smtp.gmail.com', port: 587, secure: false, label: 'gmail-587' });
    }
  } else {
    addConfig({ host: 'smtp.gmail.com', port: 465, secure: true, label: 'gmail-465' });
    addConfig({ host: 'smtp.gmail.com', port: 587, secure: false, label: 'gmail-587' });
  }

  return configs;
};

const sendMailWithFallback = async ({ emailAuth, mailOptions, context }) => {
  const forceSendGrid = String(process.env.FORCE_SENDGRID || '').toLowerCase() === 'true';
  try {
    const sentViaSendGrid = await sendMailWithSendGrid({ mailOptions, context });
    if (sentViaSendGrid) return;
  } catch (err) {
    console.error(`[Mail][${context}] SendGrid failed${forceSendGrid ? ' (FORCE_SENDGRID enabled — not falling back)' : ', falling back to SMTP'}`, err?.code || err?.message || err);
    if (forceSendGrid) throw err;
  }

  const smtpConfigs = getSmtpConfigs();
  let lastError = null;

  for (const smtpConfig of smtpConfigs) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        auth: { user: emailAuth.user, pass: emailAuth.pass },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        logger: !!parseBoolEnv(process.env.MAIL_DEBUG),
        debug: !!parseBoolEnv(process.env.MAIL_DEBUG),
      });

      await transporter.sendMail({
        ...mailOptions,
        from: mailOptions.from || emailAuth.user,
      });
      return;
    } catch (err) {
      lastError = err;
      console.error(
        `[Mail][${context}] SMTP ${smtpConfig.label} failed (${smtpConfig.host}:${smtpConfig.port}, secure=${smtpConfig.secure})`,
        err?.code || err?.message || err
      );
    }
  }

  throw lastError || new Error('SMTP send failed');
};

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

    // Tạo JWT token
    const userRole = role || 'user';
    const token = generateToken({ id, email, username, role: userRole });

    res.status(201).json({ 
      id, 
      email, 
      username, 
      role: userRole,
      token 
    });
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

    // Tạo JWT token
    const token = generateToken({
      id: account.id,
      email: account.email,
      username: account.username,
      role: account.role
    });

    res.json({
      id: account.id,
      username: account.username,
      role: account.role,
      email: account.email,
      token
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

    const frontendBaseUrl = (process.env.FRONTEND_URL || process.env.FONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const resetLink = `${frontendBaseUrl}/reset-password/${token}`;

    // Giao diện email HTML đẹp
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; text-align:center; padding:30px; background-color:#f9f9f9;">
        <h2 style="color:#1E40AF;">CoolShop - Khôi phục mật khẩu</h2>
        <p>Xin chào <strong>${account.username}</strong>,</p>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
        <a href="${resetLink}" 
          style="display:inline-block; padding:12px 24px; margin:20px 0; 
                 background-color:#1E40AF; color:white; text-decoration:none; 
                 font-weight:bold; border-radius:6px;">
          Đặt lại mật khẩu
        </a>
        <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
        <small style="color:#6B7280;">Liên kết chỉ có hiệu lực trong 15 phút.</small>
      </div>
    `;

    const emailAuth = getEmailAuthConfig();
    if (!emailAuth) {
      return res.status(500).json({
        error: 'Thiếu cấu hình EMAIL_USER/EMAIL_PASS trên server'
      });
    }

    await sendMailWithFallback({
      emailAuth,
      context: 'forgot-password',
      mailOptions: {
        from: emailAuth.user,
      to: email,
      subject: 'Khôi phục mật khẩu CoolShop',
      html: emailHtml,
      },
    });

    res.json({ message: 'Email khôi phục mật khẩu đã gửi. Vui lòng kiểm tra hộp thư.' });
  } catch (err) {
    console.error(err);
    if (err?.code === 'ETIMEDOUT' || String(err?.message || '').toLowerCase().includes('timeout')) {
      return res.status(504).json({
        error: 'Gửi email bị timeout. Vui lòng kiểm tra SMTP (EMAIL_USER/EMAIL_PASS) hoặc thử lại sau.'
      });
    }
    if (err?.code === 'EAUTH') {
      return res.status(502).json({
        error: 'SMTP xác thực thất bại (EAUTH). Kiểm tra EMAIL_USER/EMAIL_PASS (Gmail App Password).'
      });
    }
    if (err?.code === 'ENOTFOUND' || err?.code === 'EAI_AGAIN') {
      return res.status(502).json({
        error: 'Không phân giải được host SMTP. Kiểm tra SMTP_HOST/SMTP_PORT hoặc thử lại sau.'
      });
    }
    if (String(err?.code || '').startsWith('SENDGRID_')) {
      return res.status(502).json({
        error: 'SendGrid gửi mail thất bại. Kiểm tra SENDGRID_API_KEY/SENDGRID_FROM_EMAIL.'
      });
    }
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
