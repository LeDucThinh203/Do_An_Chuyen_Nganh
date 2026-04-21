import React, { useEffect, useState } from 'react';
import Session from '../../Session/session';
import { getSupportRooms } from '../../api';
import { getSupportSocket } from '../../socket/supportSocket';
import SupportChatManager from './SupportChatManager';

export default function AdminSupportChatWidget() {
  const user = Session.getUser();
  const isAdmin = user?.role === 'admin';
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;

    let mounted = true;

    const refreshUnread = async () => {
      try {
        const rooms = await getSupportRooms();
        if (!mounted) return;
        const total = (rooms || []).filter((room) => Number(room?.admin_unread_count || 0) > 0).length;
        setUnread(total);
      } catch (err) {
        console.error('[Admin Support Widget] unread error:', err);
      }
    };

    const socket = getSupportSocket();
    socket.emit('support:register', { role: 'admin', userId: user?.id, username: user?.username || 'Admin' });

    const onRoomUpdated = () => refreshUnread();
    socket.on('support:room-updated', onRoomUpdated);

    refreshUnread();
    const timer = setInterval(refreshUnread, 10000);

    return () => {
      mounted = false;
      clearInterval(timer);
      socket.off('support:room-updated', onRoomUpdated);
    };
  }, [isAdmin, user?.id, user?.username]);

  if (!isAdmin) return null;

  return (
    <>
      {open && (
        <div className="fixed right-4 bottom-20 z-[1260] w-[min(92vw,1100px)] h-[min(82vh,760px)] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
            <div>
              <h2 className="font-semibold text-slate-800">CSKH realtime</h2>
              <p className="text-xs text-slate-500">Trò chuyện với khách hàng ngay trên màn hình admin</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-9 h-9 rounded-full hover:bg-slate-200 text-slate-600 transition"
              aria-label="Đóng CSKH"
            >
              ×
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <SupportChatManager compact />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed right-4 bottom-4 z-[1250] relative w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 transition flex items-center justify-center"
        title="Mở CSKH realtime"
        aria-expanded={open}
      >
        <span className="text-xl leading-none">🛎</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
    </>
  );
}
