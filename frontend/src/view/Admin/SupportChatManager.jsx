import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  getSupportMessages,
  getSupportRooms,
  markSupportRoomRead,
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

  return (
    <div className={`${compact ? 'h-full min-h-0 rounded-none border-0 shadow-none' : 'h-[calc(100vh-170px)] rounded-2xl border border-slate-200 shadow-sm'} bg-white overflow-hidden grid grid-cols-12`}>
      <div className="col-span-4 border-r border-slate-200 flex flex-col">
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
              <p className="text-xs text-slate-500 truncate mt-1">{room.last_message || 'Chưa có tin nhắn'}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="col-span-8 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-200 bg-white">
          <p className="font-semibold text-slate-800">{activeRoom?.username || 'Chọn cuộc trò chuyện'}</p>
          <p className="text-xs text-slate-500">{activeRoom?.room_id || '---'}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-2">
          {loadingMessages && <p className="text-sm text-slate-500">Đang tải tin nhắn...</p>}
          {!loadingMessages && !activeRoomId && <p className="text-sm text-slate-500">Hãy chọn một cuộc trò chuyện để bắt đầu.</p>}

          {!loadingMessages && activeRoomId && messages.map((msg) => {
            const mine = msg.sender_role === 'admin';
            return (
              <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md'}`}>
                  {!mine && <p className="text-[11px] font-semibold text-slate-500 mb-1">{msg.sender_name || 'Khach hang'}</p>}
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="p-3 border-t border-slate-200 bg-white">
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
