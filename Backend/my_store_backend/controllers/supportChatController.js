import db from '../db.js';
import { getSupportIo } from '../services/supportChat/socketHub.js';

const buildRoomId = ({ userId, guestId }) => {
  if (userId) return `support-user-${Number(userId)}`;
  return `support-guest-${String(guestId).trim()}`;
};

const getRoomById = async (roomId) => {
  const [rows] = await db.query('SELECT * FROM support_chat_rooms WHERE room_id = ? LIMIT 1', [roomId]);
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

export const ensureRoom = async (req, res) => {
  try {
    const userId = req.user?.id ? Number(req.user.id) : null;
    if (!userId) return res.status(401).json({ error: 'Không tìm thấy user đã xác thực' });

    const { username = 'Khach hang' } = req.body || {};

    const roomId = buildRoomId({ userId, guestId: null });
    const normalizedName = String(username || 'Khach hang').trim() || 'Khach hang';

    const [existingRows] = await db.query('SELECT * FROM support_chat_rooms WHERE room_id = ? LIMIT 1', [roomId]);
    if (existingRows?.length) {
      await db.query(
        `
        UPDATE support_chat_rooms
        SET username = ?, updated_at = CURRENT_TIMESTAMP
        WHERE room_id = ?
      `,
        [normalizedName, roomId]
      );
      const latestRoom = await getRoomById(roomId);
      return res.json({ room: latestRoom || existingRows[0] });
    }

    await db.query(
      `
      INSERT INTO support_chat_rooms (room_id, user_id, guest_id, username)
      VALUES (?, ?, ?, ?)
    `,
      [roomId, Number(userId), null, normalizedName]
    );

    const latestRoom = await getRoomById(roomId);
    return res.status(201).json({ room: latestRoom || null });
  } catch (err) {
    console.error('[Support Chat] ensureRoom error:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const listRooms = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT *
      FROM support_chat_rooms
      ORDER BY COALESCE(last_message_at, updated_at) DESC
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
    const authUserId = req.user?.id ? Number(req.user.id) : null;
    const isAdmin = req.user?.role === 'admin';

    if (!roomId) return res.status(400).json({ error: 'roomId không hợp lệ' });

    if (!isAdmin) {
      const expectedRoomId = buildRoomId({ userId: authUserId, guestId: null });
      if (roomId !== expectedRoomId) {
        return res.status(403).json({ error: 'Bạn không có quyền truy cập phòng chat này' });
      }
    }

    const [rows] = await db.query(
      `
      SELECT *
      FROM support_chat_messages
      WHERE room_id = ?
      ORDER BY created_at ASC
      LIMIT ?
    `,
      [roomId, limit]
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
    const authUserId = req.user?.id ? Number(req.user.id) : null;
    const isAdmin = req.user?.role === 'admin';

    const normalizedRoomId = String(roomId || '').trim();
    const normalizedRole = isAdmin ? 'admin' : 'user';
    const normalizedMessage = String(message || '').trim();

    if (!normalizedRoomId) return res.status(400).json({ error: 'roomId là bắt buộc' });
    if (!normalizedMessage) return res.status(400).json({ error: 'message là bắt buộc' });

    const room = await getRoomById(normalizedRoomId);
    if (!room) {
      return res.status(404).json({ error: 'Không tìm thấy phòng chat' });
    }

    if (!isAdmin) {
      const expectedRoomId = buildRoomId({ userId: authUserId, guestId: null });
      if (normalizedRoomId !== expectedRoomId) {
        return res.status(403).json({ error: 'Bạn không có quyền gửi tin vào phòng này' });
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

    return res.status(201).json({ message: saved, room: latestRoom });
  } catch (err) {
    console.error('[Support Chat] sendMessage error:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const markRoomRead = async (req, res) => {
  try {
    const { roomId } = req.body || {};
    const normalizedRoomId = String(roomId || '').trim();
    const authUserId = req.user?.id ? Number(req.user.id) : null;
    const normalizedRole = req.user?.role === 'admin' ? 'admin' : 'user';

    if (!normalizedRoomId) return res.status(400).json({ error: 'roomId là bắt buộc' });

    if (normalizedRole !== 'admin') {
      const expectedRoomId = buildRoomId({ userId: authUserId, guestId: null });
      if (normalizedRoomId !== expectedRoomId) {
        return res.status(403).json({ error: 'Bạn không có quyền cập nhật phòng chat này' });
      }
    }

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
