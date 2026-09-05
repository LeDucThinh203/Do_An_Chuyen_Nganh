import React, { useState, useMemo, useEffect } from "react";
import Session from "../../Session/session";
import AdminInfo from "./AdminInfo";
import AdminAddressManager from "./AdminAddressManager";
import UserManager from "./UserManager";
import ProductManager from "./ProductManager";
import SizeManager from "./SizeManager";
import CategoryManager from "./categories/CategoryManager";
import OrderManager from "./OrderManager";
import Revenue from "./Revenue";
import SupportChatManager from "./SupportChatManager";
import { getSupportRooms } from "../../api";
import { getSupportSocket } from "../../socket/supportSocket";
import { useLocation, Link } from "react-router-dom";
import ThemeToggleBtn from "../common/ThemeToggleBtn";

export default function AdminDashboard() {
  const user = useMemo(() => (Session.isLoggedIn() ? Session.getUser() : null), []);
  const [activeTab, setActiveTab] = useState("revenue");
  const [menuOpen, setMenuOpen] = useState(true);
  const [supportUnreadTotal, setSupportUnreadTotal] = useState(0);
  const location = useLocation();

  // Xử lý activeTab từ state khi navigate về
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;

    let mounted = true;

    const refreshUnread = async () => {
      try {
        const rooms = await getSupportRooms();
        if (!mounted) return;
        const total = (rooms || []).reduce((sum, room) => sum + Number(room?.admin_unread_count || 0), 0);
        setSupportUnreadTotal(total);
      } catch (err) {
        console.error("[AdminDashboard] refresh support unread failed:", err);
      }
    };

    const socket = getSupportSocket();
    socket.emit("support:register", { role: "admin", userId: user.id, username: user.username });

    const onRoomUpdated = () => refreshUnread();
    socket.on("support:room-updated", onRoomUpdated);

    refreshUnread();
    const timer = setInterval(refreshUnread, 10000);

    return () => {
      mounted = false;
      clearInterval(timer);
      socket.off("support:room-updated", onRoomUpdated);
    };
  }, [user]);

  if (!user)
    return (
      <div className="text-rose-500 font-bold text-center mt-20 p-6 bg-white rounded-2xl max-w-md mx-auto shadow-xl border border-rose-100">
        ⚠️ Vui lòng đăng nhập để truy cập trang quản trị
      </div>
    );

  if (user.role !== "admin")
    return (
      <div className="text-rose-500 font-bold text-center mt-20 p-6 bg-white rounded-2xl max-w-md mx-auto shadow-xl border border-rose-100">
        🚫 Bạn không có quyền truy cập trang quản trị
      </div>
    );

  const menuGroups = [
    {
      groupTitle: "TỔNG QUAN",
      items: [
        { id: "revenue", label: "Doanh thu & Báo cáo", icon: "📊" },
        { id: "info", label: "Hồ sơ quản trị viên", icon: "👤" },
      ],
    },
    {
      groupTitle: "KHO & SẢN PHẨM",
      items: [
        { id: "product", label: "Quản lý sản phẩm", icon: "👕" },
        { id: "category", label: "Quản lý danh mục", icon: "🏷️" },
        { id: "size", label: "Quản lý size kích cỡ", icon: "📏" },
      ],
    },
    {
      groupTitle: "GIAO DỊCH & HỖ TRỢ",
      items: [
        { id: "orderManager", label: "Quản lý đơn hàng", icon: "📦" },
        { id: "supportChat", label: "CSKH trực tuyến", icon: "💬" },
      ],
    },
    {
      groupTitle: "NGƯỜI DÙNG & VẬN HÀNH",
      items: [
        { id: "userManager", label: "Quản lý người dùng", icon: "👥" },
        { id: "address", label: "Quản lý địa chỉ", icon: "📍" },
      ],
    },
  ];

  const getPageTitle = () => {
    const titles = {
      revenue: { title: "Bảng Giá & Báo Cáo Doanh Thu", subtitle: "Theo dõi chỉ số kinh doanh và phân tích hiệu suất" },
      info: { title: "Hồ Sơ Quản Trị Viên", subtitle: "Thông tin tài khoản và phân quyền hệ thống" },
      product: { title: "Quản Lý Sản Phẩm", subtitle: "Kiểm kê kho hàng, chỉnh sửa thông tin và giá bán" },
      category: { title: "Quản Lý Danh Mục", subtitle: "Phân loại danh mục thời trang và nhóm hàng" },
      size: { title: "Quản Lý Size Kích Cỡ", subtitle: "Thiết lập các tiêu chuẩn kích cỡ đồng bộ" },
      orderManager: { title: "Quản Lý Đơn Hàng", subtitle: "Xác nhận, theo dõi vận chuyển và xử lý thanh toán" },
      supportChat: { title: "Hỗ Trợ Khách Hàng Realtime", subtitle: "Tư vấn và phản hồi khách hàng theo thời gian thực" },
      userManager: { title: "Quản Lý Tài Khoản Người Dùng", subtitle: "Phân quyền thành viên, đặt lại mật khẩu và bảo mật" },
      address: { title: "Quản Lý Sổ Địa Chỉ", subtitle: "Danh sách địa chỉ kho hàng và giao nhận" },
    };
    return titles[activeTab] || { title: "Bảng Điều Khiển Quản Trị", subtitle: "Hệ thống quản lý CoolShop" };
  };

  const currentMeta = getPageTitle();

  return (
    <div
      className="flex h-screen overflow-hidden bg-transparent"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: 0 }}
    >
      {/* Sidebar Menu - Slate Luxury Theme */}
      <aside
        className={`bg-slate-900 text-slate-300 transition-all duration-300 flex-shrink-0 ${
          menuOpen ? "w-64" : "w-0"
        } overflow-hidden flex flex-col border-r border-slate-800/80 shadow-2xl`}
        style={{ position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 1000, margin: 0, padding: 0 }}
      >
        <div className="h-full flex flex-col">
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
                <svg className="w-5 h-5 transform -rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black tracking-tight text-white">COOLSHOP</span>
                <span className="text-[9px] uppercase tracking-widest text-blue-400 font-bold">Admin Console</span>
              </div>
            </Link>

            <button
              onClick={() => setMenuOpen(false)}
              className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800"
              title="Thu gọn menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* System Status Pill */}
          <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-950/20 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Hệ thống trực tuyến</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">v2.5</span>
          </div>

          {/* Grouped Menu List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-5 scrollbar-hide">
            {menuGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <div className="text-[10px] font-bold tracking-wider text-slate-500 px-3 uppercase mb-1">
                  {group.groupTitle}
                </div>
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-between text-xs sm:text-sm font-semibold group ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 scale-101"
                          : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`text-base transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-slate-400"}`}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.id === "supportChat" && supportUnreadTotal > 0 && (
                        <span className="text-[10px] bg-rose-500 text-white rounded-full min-w-5 h-5 px-1.5 font-bold flex items-center justify-center shadow-md shadow-rose-500/30 badge-pulse">
                          {supportUnreadTotal > 99 ? "99+" : supportUnreadTotal}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Bottom Admin User Box */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/40">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/50">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center uppercase">
                {user.username ? user.username.charAt(0) : "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{user.username}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email || "Administrator"}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col overflow-hidden bg-transparent"
        style={{ marginLeft: menuOpen ? "256px" : "0", transition: "margin-left 0.3s" }}
      >
        {/* Top Header */}
        <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/80 px-6 py-3.5 flex-shrink-0 z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {!menuOpen && (
                <button
                  onClick={() => setMenuOpen(true)}
                  className="text-slate-600 hover:text-slate-900 transition p-2 rounded-xl hover:bg-slate-100 border border-slate-200 shadow-sm"
                  title="Mở menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  {currentMeta.title}
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">{currentMeta.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <ThemeToggleBtn variant="navbar" />
              <Link
                to="/"
                className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-xs transition duration-200 flex items-center gap-1.5 shadow-sm border border-blue-200/70"
              >
                <span>🏪</span>
                <span className="hidden sm:inline">Về cửa hàng</span>
              </Link>

              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {user.username ? user.username.charAt(0).toUpperCase() : "A"}
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight">{user.username}</p>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Super Admin</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area - Scrollable */}
        <main className={`flex-1 min-h-0 bg-transparent p-4 sm:p-6 lg:p-8 ${activeTab === "supportChat" ? "overflow-hidden" : "overflow-y-auto"}`}>
          {activeTab === "revenue" && <Revenue />}
          {activeTab === "info" && <AdminInfo />}
          {activeTab === "product" && <ProductManager />}
          {activeTab === "category" && <CategoryManager />}
          {activeTab === "size" && <SizeManager />}
          {activeTab === "orderManager" && <OrderManager />}
          {activeTab === "supportChat" && (
            <div className="h-full min-h-0">
              <SupportChatManager />
            </div>
          )}
          {activeTab === "userManager" && <UserManager />}
          {activeTab === "address" && <AdminAddressManager />}
        </main>
      </div>
    </div>
  );
}