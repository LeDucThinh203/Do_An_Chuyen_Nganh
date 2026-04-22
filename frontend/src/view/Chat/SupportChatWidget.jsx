import React, { useEffect, useMemo, useRef, useState } from 'react';
import Session from '../../Session/session';
import {
  ensureSupportRoom,
  getSupportMessages,
  markSupportRoomRead,
  sendSupportMessage,
} from '../../api';
import { getSupportSocket } from '../../socket/supportSocket';

export default function SupportChatWidget({ onModeChange }) {
  const user = Session.getUser();
  const isLoggedIn = Session.isLoggedIn();
  const isAdmin = Session.isAdmin();

  const [open, setOpen] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef(null);

  const appendMessageUnique = (msg) => {
    if (!msg) return;
    setMessages((prev) => {
      if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  };

  const senderName = useMemo(() => {
    if (user?.username) return user.username;
    return 'Khach';
  }, [user]);

  const senderId = useMemo(() => {
    if (user?.id) return Number(user.id);
    return null;
  }, [user]);

  useEffect(() => {
    if (isAdmin || !isLoggedIn) return;

    let mounted = true;
    const socket = getSupportSocket();

    const bootstrap = async () => {
      try {
        const ensured = await ensureSupportRoom({
          userId: senderId,
          guestId: null,
          username: senderName,
        });

        const nextRoomId = ensured?.room?.room_id;
        if (!nextRoomId || !mounted) return;

        setRoomId(nextRoomId);

        socket.emit('support:register', {
          role: 'user',
          userId: senderId,
          guestId: null,
          username: senderName,
        });

        const history = await getSupportMessages(nextRoomId);
        if (mounted) {
          setMessages(history || []);
        }
      } catch (err) {
        console.error('[Support Widget] init error:', err);
      }
    };

    const onNewMessage = (msg) => {
      if (!msg) return;
      appendMessageUnique(msg);

      if (!open && msg.sender_role === 'admin') {
        setUnread((prev) => prev + 1);
      }
    };

    socket.on('support:new-message', onNewMessage);

    bootstrap();

    return () => {
      mounted = false;
      socket.off('support:new-message', onNewMessage);
    };
  }, [isAdmin, isLoggedIn, senderId, senderName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    if (!open || !roomId) return;
    setUnread(0);
    markSupportRoomRead({ roomId, readerRole: 'user' }).catch(() => {});
  }, [open, roomId]);

  if (isAdmin || !isLoggedIn) return null;

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !roomId || sending) return;

    setSending(true);
    try {
      const res = await sendSupportMessage({
        roomId,
        senderRole: 'user',
        senderId,
        senderName,
        message: trimmed,
      });

      setInput('');

      if (res?.message) appendMessageUnique(res.message);
    } catch (err) {
      console.error('[Support Widget] send error:', err);
      alert(`Gửi tin nhắn thất bại: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed right-3 md:right-24 bottom-6 z-[1200]">
      {!open && onModeChange && (
        <div className="absolute right-16 bottom-1 flex items-center gap-1 rounded-full border border-slate-200 bg-white/95 p-1 shadow-lg backdrop-blur">
          <button
            type="button"
            onClick={() => onModeChange('ai')}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            AI Chat
          </button>
          <button
            type="button"
            onClick={() => onModeChange('support')}
            className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
          >
            CSKH
          </button>
        </div>
      )}

      {open && (
        <div
          className="absolute right-0 bottom-16 w-[min(340px,calc(100vw-16px))] max-w-[calc(100vw-16px)] h-[min(480px,calc(100vh-96px))] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        >
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-semibold">Chăm sóc khách hàng</p>
              <p className="text-xs text-blue-100">Admin đang trực tuyến</p>
            </div>
            <button className="text-white/90 hover:text-white" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
            {messages.length === 0 && (
              <div className="text-xs text-slate-500 text-center py-4">
                Hãy bắt đầu cuộc trò chuyện với admin.
              </div>
            )}

            {messages.map((msg) => {
              const mine = msg.sender_role === 'user';
              return (
                <div key={msg.id || `${msg.sender_role}-${msg.created_at}-${msg.message}`} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md'}`}>
                    {!mine && (
                      <p className="text-[11px] font-semibold text-slate-500 mb-1">{msg.sender_name || 'Admin'}</p>
                    )}
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 p-3 bg-white">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                placeholder="Nhập nội dung cần hỗ trợ..."
                className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl ring-4 ring-white hover:bg-blue-700 transition flex items-center justify-center"
        title="Mở chat chăm sóc khách hàng"
      >
        <span className="text-xs font-bold tracking-wide leading-none">CSKH</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
    </div>
  );
}
