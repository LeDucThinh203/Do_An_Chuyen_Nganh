import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  acknowledgeSupportRoom,
  getSupportMessages,
  getSupportRooms,
  markSupportRoomRead,
  resumeSupportRoomNotifications,
  sendSupportMessage,
} from '../../api';
import Session from '../../Session/session';
import { getSupportSocket } from '../../socket/supportSocket';

export default function SupportChatManager({ compact = false }) {
  const user = Session.getUser();
  const adminId = user?.id ? Number(user.id) : null;
  const adminName = user?.username || 'Admin';

  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [acknowledgingRoom, setAcknowledgingRoom] = useState(false);
  const [resumingRoom, setResumingRoom] = useState(false);
  const endRef = useRef(null);

  const appendMessageUnique = (msg) => {
    if (!msg) return;
    setMessages((prev) => {
      if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  };

  const activeRoom = useMemo(
    () => rooms.find((room) => room.room_id === activeRoomId) || null,
    [rooms, activeRoomId]
  );

  const notificationPauseText = useMemo(() => {
    if (!activeRoom?.support_suppress_until) return null;

    const suppressUntil = new Date(activeRoom.support_suppress_until);
    if (Number.isNaN(suppressUntil.getTime())) return null;

    const remainingMs = suppressUntil.getTime() - Date.now();
    if (remainingMs <= 0) return null;

    const totalMinutes = Math.ceil(remainingMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours > 0 ? `${hours} giờ ` : ''}${minutes} phút`;
  }, [activeRoom?.support_suppress_until]);

  const getRoomPauseText = (room) => {
    if (!room?.support_suppress_until) return null;

    const suppressUntil = new Date(room.support_suppress_until);
    if (Number.isNaN(suppressUntil.getTime())) return null;

    const remainingMs = suppressUntil.getTime() - Date.now();
    if (remainingMs <= 0) return null;

    const totalMinutes = Math.ceil(remainingMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours > 0 ? `${hours} giờ ` : ''}${minutes} phút`;
  };

  const loadRooms = async () => {
    try {
      setLoadingRooms(true);
      const data = await getSupportRooms();
      setRooms(data || []);
      if (!activeRoomId && data?.length) {
        setActiveRoomId(data[0].room_id);
      }
    } catch (err) {
      console.error('[Support Admin] loadRooms error:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  const loadMessages = async (roomId) => {
    if (!roomId) return;
    try {
      setLoadingMessages(true);
      const data = await getSupportMessages(roomId);
      setMessages(data || []);
      await markSupportRoomRead({ roomId, readerRole: 'admin' });
      setRooms((prev) => prev.map((r) => (r.room_id === roomId ? { ...r, admin_unread_count: 0 } : r)));
    } catch (err) {
      console.error('[Support Admin] loadMessages error:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    loadMessages(activeRoomId);
  }, [activeRoomId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const socket = getSupportSocket();
    socket.emit('support:register', { role: 'admin', userId: adminId, username: adminName });

    const onRoomUpdated = (room) => {
      if (!room?.room_id) return;

      setRooms((prev) => {
        const idx = prev.findIndex((r) => r.room_id === room.room_id);
        if (idx === -1) return [room, ...prev];
        const next = [...prev];
        next[idx] = room;
        next.sort((a, b) => new Date(b.last_message_at || b.updated_at || 0) - new Date(a.last_message_at || a.updated_at || 0));
        return next;
      });
    };

    const onNewMessage = (msg) => {
      if (!msg?.room_id) return;
      if (msg.room_id === activeRoomId) {
        appendMessageUnique(msg);
      }
    };

    socket.on('support:room-updated', onRoomUpdated);
    socket.on('support:new-message', onNewMessage);

    return () => {
      socket.off('support:room-updated', onRoomUpdated);
      socket.off('support:new-message', onNewMessage);
    };
  }, [activeRoomId, adminId, adminName]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !activeRoomId || sending) return;

    setSending(true);
    try {
      const res = await sendSupportMessage({
        roomId: activeRoomId,
        senderRole: 'admin',
        senderId: adminId,
        senderName: adminName,
        message: trimmed,
      });

      if (res?.message) appendMessageUnique(res.message);
      setInput('');
      await markSupportRoomRead({ roomId: activeRoomId, readerRole: 'admin' });
    } catch (err) {
      console.error('[Support Admin] send error:', err);
      alert(`Gửi tin nhắn thất bại: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleAcknowledgeRoom = async () => {
    if (!activeRoomId || acknowledgingRoom) return;

    setAcknowledgingRoom(true);
    try {
      const res = await acknowledgeSupportRoom({ roomId: activeRoomId });
      const updatedRoom = res?.room;
      if (updatedRoom?.room_id) {
        setRooms((prev) => prev.map((room) => (room.room_id === updatedRoom.room_id ? updatedRoom : room)));
      }
    } catch (err) {
      console.error('[Support Admin] acknowledge error:', err);
      alert(`Không thể xác nhận phòng chat: ${err.message}`);
    } finally {
      setAcknowledgingRoom(false);
    }
  };

  const handleResumeNotifications = async () => {
    if (!activeRoomId || resumingRoom) return;

    setResumingRoom(true);
    try {
      const res = await resumeSupportRoomNotifications({ roomId: activeRoomId });
      const updatedRoom = res?.room;
      if (updatedRoom?.room_id) {
        setRooms((prev) => prev.map((room) => (room.room_id === updatedRoom.room_id ? updatedRoom : room)));
      }
    } catch (err) {
      console.error('[Support Admin] resume notifications error:', err);
      alert(`Không thể bật lại thông báo: ${err.message}`);
    } finally {
      setResumingRoom(false);
    }
  };

  return (
    <div className={`${compact ? 'h-full min-h-0 rounded-none border-0 shadow-none' : 'h-full min-h-0 rounded-2xl border border-slate-200 shadow-sm'} bg-white overflow-hidden grid grid-cols-12`}>
      <div className="col-span-4 min-h-0 border-r border-slate-200 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-800">Hộp thư hỗ trợ</h2>
          <p className="text-xs text-slate-500">Cuộc trò chuyện giữa khách hàng và admin</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingRooms && <p className="text-sm text-slate-500 p-4">Đang tải danh sách chat...</p>}
          {!loadingRooms && rooms.length === 0 && <p className="text-sm text-slate-500 p-4">Chưa có cuộc trò chuyện nào.</p>}

          {rooms.map((room) => (
            <button
              key={room.room_id}
              onClick={() => setActiveRoomId(room.room_id)}
              className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition ${activeRoomId === room.room_id ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-800 truncate">{room.username || room.room_id}</p>
                {room.admin_unread_count > 0 && (
                  <span className="text-xs bg-red-500 text-white rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                    {room.admin_unread_count}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                {getRoomPauseText(room) ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                    Mail tắt còn {getRoomPauseText(room)}
                  </span>
                ) : room.support_suppress_until ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                    Mail đã mở lại
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500 truncate mt-1">{room.last_message || 'Chưa có tin nhắn'}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="col-span-8 min-h-0 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-800">{activeRoom?.username || 'Chọn cuộc trò chuyện'}</p>
              <p className="text-xs text-slate-500">{activeRoom?.room_id || '---'}</p>
              {notificationPauseText && (
                <p className="text-xs text-amber-600 mt-1">
                  Email đang tạm dừng trong {notificationPauseText}
                </p>
              )}
            </div>

            <div className="flex flex-nowrap items-center gap-2 shrink-0 overflow-x-auto">
              <button
                onClick={handleAcknowledgeRoom}
                disabled={!activeRoomId || acknowledgingRoom}
                className="shrink-0 whitespace-nowrap rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
              >
                {acknowledgingRoom ? 'Đang xác nhận...' : 'Đã nhận'}
              </button>

              <button
                onClick={handleResumeNotifications}
                disabled={!activeRoomId || resumingRoom || !activeRoom?.support_suppress_until}
                className="shrink-0 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {resumingRoom ? 'Đang mở lại...' : 'Mở lại'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-slate-50 space-y-2">
          {loadingMessages && <p className="text-sm text-slate-500">Đang tải tin nhắn...</p>}
          {!loadingMessages && !activeRoomId && <p className="text-sm text-slate-500">Hãy chọn một cuộc trò chuyện để bắt đầu.</p>}

          {!loadingMessages && activeRoomId && messages.map((msg) => {
            const mine = msg.sender_role === 'admin';
            return (
              <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`min-w-0 max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md'}`}>
                  {!mine && <p className="text-[11px] font-semibold text-slate-500 mb-1">{msg.sender_name || 'Khach hang'}</p>}
                  <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{msg.message}</p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="shrink-0 p-3 border-t border-slate-200 bg-white">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              disabled={!activeRoomId}
              placeholder={activeRoomId ? 'Nhập phản hồi cho khách hàng...' : 'Chọn cuộc trò chuyện trước'}
              className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-100"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim() || !activeRoomId}
              className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Gửi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
