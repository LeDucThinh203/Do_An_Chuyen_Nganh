// src/view/User/UserInfo.jsx
import React, { useMemo } from "react";
import Session from "../../Session/session";

export default function UserInfo({ onNavigate }) {
  const user = useMemo(() => {
    return Session.isLoggedIn() ? Session.getUser() : null;
  }, []);

  if (!user) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center text-rose-500 font-semibold border border-rose-100 shadow-sm">
        ⚠️ Vui lòng đăng nhập để xem thông tin cá nhân.
      </div>
    );
  }

  const userInitial = (user.username || "U").charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Hero Profile Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-cyan-400 p-1 shadow-2xl shadow-blue-500/30 flex-shrink-0">
            <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center text-white font-black text-4xl">
              {userInitial}
            </div>
          </div>

          {/* Profile Basic Info */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {user.username}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400/20 to-yellow-500/20 text-yellow-300 border border-yellow-400/30">
                ✨ Hội Viên CoolClub
              </span>
            </div>

            <p className="text-slate-300 text-sm sm:text-base font-normal">
              {user.email || "Chưa thiết lập địa chỉ email"}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Tài khoản đang hoạt động</span>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <span>Mã số:</span>
                <span className="font-mono font-bold text-white">#{user.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: ID */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ID Thành viên</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">
              #
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 font-mono">{user.id}</p>
          <p className="text-xs text-slate-500 mt-1">Định danh tài khoản</p>
        </div>

        {/* Card 2: Tên người dùng */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tên người dùng</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">
              👤
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 truncate">{user.username}</p>
          <p className="text-xs text-slate-500 mt-1">Dùng để đăng nhập</p>
        </div>

        {/* Card 3: Email */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Địa chỉ Email</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
              ✉️
            </div>
          </div>
          <p className="text-base font-bold text-slate-900 truncate" title={user.email}>
            {user.email || "Chưa cập nhật"}
          </p>
          <p className="text-xs text-slate-500 mt-1">Nhận hóa đơn & ưu đãi</p>
        </div>

        {/* Card 4: Vai trò */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cấp bậc tài khoản</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm">
              👑
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
            {user.role === "admin" ? "Quản trị viên" : "Thành viên chuẩn"}
          </span>
          <p className="text-xs text-slate-500 mt-2">Hưởng toàn bộ đặc quyền hội viên</p>
        </div>
      </div>

      {/* Quick Access Shortcuts */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span>⚡</span>
          <span>Lối Tắt Tiện Ích</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigate && onNavigate("orders")}
            className="p-5 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/70 hover:border-blue-200 transition text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition">
              🛍️
            </div>
            <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition">Đơn hàng của tôi</h4>
            <p className="text-xs text-slate-500 mt-1">Tra cứu tiến độ và lịch sử các món đồ thể thao đã đặt</p>
          </button>

          <button
            onClick={() => onNavigate && onNavigate("addressList")}
            className="p-5 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/70 hover:border-emerald-200 transition text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition">
              📍
            </div>
            <h4 className="font-bold text-slate-900 group-hover:text-emerald-600 transition">Sổ địa chỉ nhận hàng</h4>
            <p className="text-xs text-slate-500 mt-1">Xem và quản lý các địa chỉ giao nhận của bạn</p>
          </button>

          <button
            onClick={() => onNavigate && onNavigate("password")}
            className="p-5 rounded-2xl bg-slate-50 hover:bg-purple-50/60 border border-slate-200/70 hover:border-purple-200 transition text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition">
              🛡️
            </div>
            <h4 className="font-bold text-slate-900 group-hover:text-purple-600 transition">Bảo mật & Đổi mật khẩu</h4>
            <p className="text-xs text-slate-500 mt-1">Đổi mật khẩu định kỳ để nâng cao tính an toàn</p>
          </button>
        </div>
      </div>
    </div>
  );
}
