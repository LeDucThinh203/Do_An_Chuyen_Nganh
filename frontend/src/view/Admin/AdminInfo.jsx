import React, { useMemo } from "react";
import Session from "../../Session/session";

export default function AdminInfo() {
  const user = useMemo(() => {
    return Session.isLoggedIn() ? Session.getUser() : null;
  }, []);

  if (!user)
    return (
      <div className="text-rose-500 font-bold text-center mt-10 p-6 bg-white rounded-2xl max-w-md mx-auto shadow-xl">
        ⚠️ Vui lòng đăng nhập để xem thông tin
      </div>
    );
  if (user.role !== "admin")
    return (
      <div className="text-rose-500 font-bold text-center mt-10 p-6 bg-white rounded-2xl max-w-md mx-auto shadow-xl">
        🚫 Bạn không có quyền truy cập trang này
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Executive Profile Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        {/* Banner Cover */}
        <div className="h-44 sm:h-52 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 relative p-6 flex items-end">
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Tài Khoản Đang Hoạt Động</span>
          </div>
        </div>

        {/* Profile Details Bar */}
        <div className="px-6 sm:px-10 pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
            <div className="flex items-end gap-4">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 border-4 border-white shadow-xl text-white font-black text-4xl sm:text-5xl flex items-center justify-center uppercase">
                {user.username ? user.username.charAt(0) : "A"}
              </div>
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{user.username}</h2>
                  <span className="text-blue-600 text-xl" title="Quản trị viên đã xác thực">✓</span>
                </div>
                <p className="text-sm text-slate-500">{user.email || "Quản trị viên hệ thống CoolShop"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs uppercase tracking-wide border border-blue-200">
                🛡️ Super Administrator
              </span>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Mã Định Danh (ID)</span>
              <p className="text-lg font-black text-slate-800">#{user.id}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Tên Người Dùng</span>
              <p className="text-lg font-bold text-slate-800 truncate">{user.username}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Quản Trị</span>
              <p className="text-sm font-bold text-slate-800 truncate">{user.email || "Chưa thiết lập"}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Cấp Bậc Quyền Hạn</span>
              <p className="text-sm font-bold text-blue-600 capitalize">Toàn quyền (Root Admin)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions and Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
              ⚡
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Đặc Quyền Quản Trị</h3>
              <p className="text-xs text-slate-500">Các tính năng được kích hoạt cho tài khoản này</p>
            </div>
          </div>

          <ul className="space-y-3 pt-2 text-sm text-slate-600">
            <li className="flex items-center gap-2.5">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>Toàn quyền quản lý kho, thêm/sửa/xóa sản phẩm và giá</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>Truy cập báo cáo doanh thu tuần, biểu đồ và số liệu tài chính</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>Xử lý tình trạng đơn hàng, duyệt giao dịch và đổi trả</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>Phân quyền tài khoản thành viên và hỗ trợ khách hàng realtime</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
              🔒
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Bảo Mật & Phiên Làm Việc</h3>
              <p className="text-xs text-slate-500">Thông tin xác thực và an toàn dữ liệu</p>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-sm">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600">Loại xác thực:</span>
              <span className="font-bold text-slate-900">JWT Token Bearer</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600">Mã hóa kết nối:</span>
              <span className="font-bold text-emerald-600">SSL 256-bit Secure</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600">Trạng thái phiên:</span>
              <span className="font-bold text-blue-600">Hoạt động bình thường</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
