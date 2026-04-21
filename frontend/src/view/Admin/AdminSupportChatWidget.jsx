import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Session from '../../Session/session';
import { getSupportRooms } from '../../api';
import { getSupportSocket } from '../../socket/supportSocket';

export default function AdminSupportChatWidget() {
  const navigate = useNavigate();
  const user = Session.getUser();
  const isAdmin = user?.role === 'admin';
  const [unread, setUnread] = useState(0);

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
    <button
      onClick={() => navigate('/admin', { state: { activeTab: 'supportChat', forceAt: Date.now() } })}
      className="fixed right-4 bottom-4 z-[1250] w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 transition"
      title="Mở CSKH realtime"
    >
      <span className="text-xl leading-none">🛎</span>
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  );
}
