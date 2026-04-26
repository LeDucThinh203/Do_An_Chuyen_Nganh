import React, { useEffect, useState } from 'react';
import Session from '../../Session/session';
import { getSupportRooms } from '../../api';
import { getSupportSocket } from '../../socket/supportSocket';
import SupportChatManager from './SupportChatManager';

export default function AdminSupportChatWidget({ forceAdmin = false }) {
  const user = Session.getUser();
  const isAdmin = forceAdmin || Session.isAdmin();
  const [unread, setUnread] = useState(0);
  const [pausedRooms, setPausedRooms] = useState(0);
  const [open, setOpen] = useState(false);

  const countPausedRooms = (rooms = []) =>
    (rooms || []).filter((room) => {
      if (!room?.support_suppress_until) return false;
      const suppressUntil = new Date(room.support_suppress_until);
      return !Number.isNaN(suppressUntil.getTime()) && suppressUntil.getTime() > Date.now();
    }).length;

  useEffect(() => {
    if (!isAdmin) return;

    let mounted = true;

    const refreshUnread = async () => {
      try {
        const rooms = await getSupportRooms();
        if (!mounted) return;
        const total = (rooms || []).filter((room) => Number(room?.admin_unread_count || 0) > 0).length;
        setUnread(total);
        setPausedRooms(countPausedRooms(rooms));
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
        <div
          className="rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
          style={{
            position: 'fixed',
            right: '24px',
            bottom: '96px',
            width: 'min(92vw, 1100px)',
            height: 'min(82vh, 760px)',
            zIndex: 2147483000,
          }}
        >
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
        className="relative transition"
        style={{
          position: 'fixed',
          right: '24px',
          bottom: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '9999px',
          background: '#2563eb',
          color: '#ffffff',
          border: '4px solid #ffffff',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2147483000,
          cursor: 'pointer',
        }}
        title="Mở CSKH realtime"
        aria-expanded={open}
      >
        <span className="text-xs font-bold leading-none">CSKH</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
        {pausedRooms > 0 && (
          <span
            className={`absolute ${unread > 0 ? 'top-4 -right-1' : '-top-1 -right-1'} bg-amber-500 text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center`}
            title={`Đang tắt thông báo mail ở ${pausedRooms} phòng`}
          >
            {pausedRooms > 99 ? '99+' : pausedRooms}
          </span>
        )}
      </button>
    </>
  );
}
