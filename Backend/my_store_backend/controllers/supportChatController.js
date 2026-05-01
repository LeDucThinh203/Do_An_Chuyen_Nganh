import db from '../db.js';
import * as accountRepo from '../repositories/accountRepository.js';
import nodemailer from 'nodemailer';
import { getSupportIo } from '../services/supportChat/socketHub.js';

const getEmailAuthConfig = () => {
  const user = String(process.env.EMAIL_USER || '').trim();
  // Gmail app password is often copied with spaces every 4 chars.
  const pass = String(process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  if (!user || !pass) return null;
  return { user, pass };
};

const parseBoolEnv = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const getSmtpConfigs = () => {
  const smtpHost = String(process.env.SMTP_HOST || '').trim();
  const smtpPortRaw = String(process.env.SMTP_PORT || '').trim();
  const smtpSecureEnv = parseBoolEnv(process.env.SMTP_SECURE);

  if (smtpHost || smtpPortRaw) {
    const port = Number(smtpPortRaw) || 587;
    return [{
      host: smtpHost || 'smtp.gmail.com',
      port,
      secure: smtpSecureEnv ?? port === 465,
      label: 'custom',
    }];
  }

  return [
    { host: 'smtp.gmail.com', port: 465, secure: true, label: 'gmail-465' },
    { host: 'smtp.gmail.com', port: 587, secure: false, label: 'gmail-587' },
  ];
};

const sendMailWithFallback = async ({ emailAuth, mailOptions, context }) => {
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

const buildRoomId = ({ userId, guestId }) => {
  if (userId) return `support-user-${Number(userId)}`;
  return `support-guest-${String(guestId).trim()}`;
};

const resolveAuthUserId = (user) => {
  const rawId = user?.id ?? user?.account_id ?? user?.user_id ?? user?.sub ?? null;
  const normalized = Number(rawId);
  if (!Number.isFinite(normalized) || normalized <= 0) return null;
  return normalized;
};

const getRoomById = async (roomId) => {
  await ensureSupportNotificationTable();
  const [rows] = await db.query(
    `
    SELECT
      r.*,
      n.acknowledged_at AS support_acknowledged_at,
      n.suppress_until AS support_suppress_until,
      n.updated_at AS support_notification_updated_at
    FROM support_chat_rooms r
    LEFT JOIN support_chat_room_notifications n ON n.room_id = r.room_id
    WHERE r.room_id = ?
    LIMIT 1
  `,
    [roomId]
  );
  return rows?.[0] || null;
};

const touchRoomAfterMessage = async ({ roomId, senderRole, message }) => {
  const [meta] = await db.query(
    `
    UPDATE support_chat_rooms
    SET
      last_message = ?,
      last_sender_role = ?,
      last_message_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP,
      admin_unread_count = CASE WHEN ? = 'user' THEN admin_unread_count + 1 ELSE 0 END,
      user_unread_count = CASE WHEN ? = 'admin' THEN user_unread_count + 1 ELSE 0 END
    WHERE room_id = ?
  `,
    [message, senderRole, senderRole, senderRole, roomId]
  );

  return meta?.affectedRows > 0;
};

let supportNotificationTableInitPromise = null;

const ensureSupportNotificationTable = async () => {
  if (!supportNotificationTableInitPromise) {
    supportNotificationTableInitPromise = db.query(`
      CREATE TABLE IF NOT EXISTS support_chat_room_notifications (
        room_id VARCHAR(128) PRIMARY KEY,
        acknowledged_at TIMESTAMPTZ NULL,
        suppress_until TIMESTAMPTZ NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  await supportNotificationTableInitPromise;
};

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getRoomNotificationState = async (roomId) => {
  await ensureSupportNotificationTable();
  const [rows] = await db.query(
    `
    SELECT room_id, acknowledged_at, suppress_until, updated_at
    FROM support_chat_room_notifications
    WHERE room_id = ?
    LIMIT 1
  `,
    [roomId]
  );
  return rows?.[0] || null;
};

const getSupportNotificationRecipients = async () => {
  const accounts = await accountRepo.getAllAccounts();
  const adminEmails = [...new Set(
    (accounts || [])
      .filter((account) => String(account?.role || '').toLowerCase() === 'admin')
      .map((account) => String(account?.email || '').trim())
      .filter(Boolean)
  )];

  if (adminEmails.length > 0) {
    return adminEmails;
  }

  const fallbackRecipient = String(process.env.SUPPORT_NOTIFICATION_EMAIL || process.env.EMAIL_USER || '').trim();
  return fallbackRecipient ? [fallbackRecipient] : [];
};

const sendSupportNotificationEmail = async ({ room, message, senderName }) => {
  const emailAuth = getEmailAuthConfig();
  const recipients = await getSupportNotificationRecipients();

  if (!recipients.length || !emailAuth) {
    console.warn('[Support Chat] Skip notification email: missing EMAIL_USER/EMAIL_PASS or recipients');
    return;
  }

  const notificationState = room?.room_id ? await getRoomNotificationState(room.room_id) : null;
  const suppressUntil = notificationState?.suppress_until ? new Date(notificationState.suppress_until) : null;
  if (suppressUntil && suppressUntil.getTime() > Date.now()) {
    return;
  }

  const customerName = String(senderName || room?.username || 'Khách hàng').trim() || 'Khách hàng';
  const safeRoomId = escapeHtml(room?.room_id || '');
  const safeMessage = escapeHtml(message);
  const safeCustomerName = escapeHtml(customerName);

  await sendMailWithFallback({
    emailAuth,
    context: 'support-notification',
    mailOptions: {
      from: emailAuth.user,
      to: recipients,
      subject: `[CSKH] ${customerName} vừa nhắn tin`,
      html: `
        <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px; color:#0f172a;">
          <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:24px;">
            <h2 style="margin:0 0 16px; color:#1e40af;">Có khách hàng nhắn tin mới</h2>
            <p style="margin:0 0 8px;"><strong>Khách hàng:</strong> ${safeCustomerName}</p>
            <p style="margin:0 0 8px;"><strong>Phòng chat:</strong> ${safeRoomId}</p>
            <p style="margin:0 0 8px;"><strong>Nội dung:</strong></p>
            <div style="background:#f1f5f9; border-radius:8px; padding:16px; white-space:pre-wrap; line-height:1.6;">${safeMessage}</div>
            <p style="margin:16px 0 0; color:#64748b; font-size:13px;">Email này được gửi tự động từ hệ thống CSKH.</p>
          </div>
        </div>
      `,
    },
  });
};

export const ensureRoom = async (req, res) => {
  try {
    const userId = resolveAuthUserId(req.user);
    if (!userId) return res.status(401).json({ error: 'Không tìm thấy user đã xác thực' });

    const roomId = buildRoomId({ userId, guestId: null });

    const [existingRows] = await db.query('SELECT * FROM support_chat_rooms WHERE room_id = ? LIMIT 1', [roomId]);
    if (existingRows?.length) {
      const latestRoom = await getRoomById(roomId);
      return res.json({ room: latestRoom || existingRows[0] });
    }

    // Do not create empty room here; room is created on first message.
    return res.json({ room: null, requiresFirstMessage: true });
  } catch (err) {
    console.error('[Support Chat] ensureRoom error:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const listRooms = async (req, res) => {
  try {
    await ensureSupportNotificationTable();
    const [rows] = await db.query(
      `
      SELECT
        r.*,
        n.acknowledged_at AS support_acknowledged_at,
        n.suppress_until AS support_suppress_until,
        n.updated_at AS support_notification_updated_at
      FROM support_chat_rooms r
      LEFT JOIN support_chat_room_notifications n ON n.room_id = r.room_id
      ORDER BY COALESCE(r.last_message_at, r.updated_at) DESC
      LIMIT 200
    `
    );
    return res.json(rows || []);
  } catch (err) {
    console.error('[Support Chat] listRooms error:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const getMessagesByRoom = async (req, res) => {
  try {
    const roomId = String(req.params.roomId || '').trim();
    const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 500);
    const authUserId = resolveAuthUserId(req.user);
    const isAdmin = req.user?.role === 'admin';

    if (!roomId) return res.status(400).json({ error: 'roomId không hợp lệ' });

    const effectiveRoomId = isAdmin ? roomId : buildRoomId({ userId: authUserId, guestId: null });

    const [rows] = await db.query(
      `
      SELECT *
      FROM support_chat_messages
      WHERE room_id = ?
      ORDER BY created_at ASC
      LIMIT ?
    `,
      [effectiveRoomId, limit]
    );

    return res.json(rows || []);
  } catch (err) {
    console.error('[Support Chat] getMessagesByRoom error:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { roomId, senderName = '', message = '' } = req.body || {};
    const authUserId = resolveAuthUserId(req.user);
    const isAdmin = req.user?.role === 'admin';

    const requestedRoomId = String(roomId || '').trim();
    const normalizedRole = isAdmin ? 'admin' : 'user';
    const normalizedMessage = String(message || '').trim();
    const normalizedRoomId = isAdmin
      ? requestedRoomId
      : buildRoomId({ userId: authUserId, guestId: null });

    if (!normalizedRoomId) return res.status(400).json({ error: 'roomId là bắt buộc' });
    if (!normalizedMessage) return res.status(400).json({ error: 'message là bắt buộc' });

    let room = await getRoomById(normalizedRoomId);
    if (!room) {
      if (isAdmin) {
        return res.status(404).json({ error: 'Không tìm thấy phòng chat' });
      }

      const normalizedName = String(senderName || req.user?.username || 'Khach hang').trim() || 'Khach hang';
      await db.query(
        `
        INSERT INTO support_chat_rooms (room_id, user_id, guest_id, username)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (room_id) DO NOTHING
      `,
        [normalizedRoomId, Number(authUserId), null, normalizedName]
      );

      room = await getRoomById(normalizedRoomId);
      if (!room) {
        return res.status(500).json({ error: 'Không thể khởi tạo phòng chat hỗ trợ' });
      }
    }

    const [, insertedRows] = await db.query(
      `
      INSERT INTO support_chat_messages (room_id, sender_role, sender_id, sender_name, message)
      VALUES (?, ?, ?, ?, ?)
      RETURNING *
    `,
      [
        normalizedRoomId,
        normalizedRole,
        authUserId,
        String(senderName || '').trim() || null,
        normalizedMessage
      ]
    );

    await touchRoomAfterMessage({
      roomId: normalizedRoomId,
      senderRole: normalizedRole,
      message: normalizedMessage
    });

    const latestRoom = await getRoomById(normalizedRoomId);
    const saved = insertedRows?.[0] || null;

    const io = getSupportIo();
    if (io && saved) {
      io.to(normalizedRoomId).emit('support:new-message', saved);
      io.to('support-admins').emit('support:room-updated', latestRoom);
    }

    if (!isAdmin) {
      void sendSupportNotificationEmail({
        room: latestRoom || room,
        message: normalizedMessage,
        senderName: String(senderName || '').trim(),
      }).catch((emailErr) => {
        console.error('[Support Chat] notification email error:', emailErr);
      });
    }

    return res.status(201).json({ message: saved, room: latestRoom });
  } catch (err) {
    console.error('[Support Chat] sendMessage error:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const acknowledgeRoom = async (req, res) => {
  try {
    const { roomId } = req.body || {};
    const normalizedRoomId = String(roomId || '').trim();
    const isAdmin = req.user?.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ error: 'Chỉ admin mới có thể xác nhận phòng hỗ trợ' });
    }

    if (!normalizedRoomId) return res.status(400).json({ error: 'roomId là bắt buộc' });

    const room = await getRoomById(normalizedRoomId);
    if (!room) {
      return res.status(404).json({ error: 'Không tìm thấy phòng chat' });
    }

    await ensureSupportNotificationTable();
    await db.query(
      `
      INSERT INTO support_chat_room_notifications (room_id, acknowledged_at, suppress_until, updated_at)
      VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '12 hours', CURRENT_TIMESTAMP)
      ON CONFLICT (room_id)
      DO UPDATE SET
        acknowledged_at = EXCLUDED.acknowledged_at,
        suppress_until = EXCLUDED.suppress_until,
        updated_at = EXCLUDED.updated_at
    `,
      [normalizedRoomId]
    );

    await db.query(
      'UPDATE support_chat_rooms SET admin_unread_count = 0, updated_at = CURRENT_TIMESTAMP WHERE room_id = ?',
      [normalizedRoomId]
    );

    const latestRoom = await getRoomById(normalizedRoomId);
    const io = getSupportIo();
    if (io && latestRoom) {
      io.to('support-admins').emit('support:room-updated', latestRoom);
      io.to(normalizedRoomId).emit('support:room-updated', latestRoom);
    }

    return res.json({ room: latestRoom });
  } catch (err) {
    console.error('[Support Chat] acknowledgeRoom error:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const resumeRoomNotifications = async (req, res) => {
  try {
    const { roomId } = req.body || {};
    const normalizedRoomId = String(roomId || '').trim();
    const isAdmin = req.user?.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ error: 'Chỉ admin mới có thể bật lại thông báo' });
    }

    if (!normalizedRoomId) return res.status(400).json({ error: 'roomId là bắt buộc' });

    const room = await getRoomById(normalizedRoomId);
    if (!room) {
      return res.status(404).json({ error: 'Không tìm thấy phòng chat' });
    }

    await ensureSupportNotificationTable();
    await db.query(
      `
      INSERT INTO support_chat_room_notifications (room_id, updated_at)
      VALUES (?, CURRENT_TIMESTAMP)
      ON CONFLICT (room_id)
      DO UPDATE SET
        suppress_until = NULL,
        updated_at = CURRENT_TIMESTAMP
    `,
      [normalizedRoomId]
    );

    const latestRoom = await getRoomById(normalizedRoomId);
    const io = getSupportIo();
    if (io && latestRoom) {
      io.to('support-admins').emit('support:room-updated', latestRoom);
      io.to(normalizedRoomId).emit('support:room-updated', latestRoom);
    }

    return res.json({ room: latestRoom });
  } catch (err) {
    console.error('[Support Chat] resumeRoomNotifications error:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const markRoomRead = async (req, res) => {
  try {
    const { roomId } = req.body || {};
    const requestedRoomId = String(roomId || '').trim();
    const authUserId = resolveAuthUserId(req.user);
    const normalizedRole = req.user?.role === 'admin' ? 'admin' : 'user';
    const normalizedRoomId = normalizedRole === 'admin'
      ? requestedRoomId
      : buildRoomId({ userId: authUserId, guestId: null });

    if (!normalizedRoomId) return res.status(400).json({ error: 'roomId là bắt buộc' });

    if (normalizedRole === 'admin') {
      await db.query(
        'UPDATE support_chat_rooms SET admin_unread_count = 0, updated_at = CURRENT_TIMESTAMP WHERE room_id = ?',
        [normalizedRoomId]
      );
    } else {
      await db.query(
        'UPDATE support_chat_rooms SET user_unread_count = 0, updated_at = CURRENT_TIMESTAMP WHERE room_id = ?',
        [normalizedRoomId]
      );
    }

    const latestRoom = await getRoomById(normalizedRoomId);
    const io = getSupportIo();
    if (io && latestRoom) {
      io.to('support-admins').emit('support:room-updated', latestRoom);
      io.to(normalizedRoomId).emit('support:room-updated', latestRoom);
    }

    return res.json({ room: latestRoom });
  } catch (err) {
    console.error('[Support Chat] markRoomRead error:', err);
    return res.status(500).json({ error: err.message });
  }
};
