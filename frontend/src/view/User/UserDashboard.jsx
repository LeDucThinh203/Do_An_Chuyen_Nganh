// src/view/User/UserDashboard.jsx
import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Session from "../../Session/session";
import UserInfo from "./UserInfo";
import ChangePassword from "./ChangePassword";
import ManageAddress from "./ManageAddress";
import Address from "./Address";
import OrderManager from "./OrderManager";

export default function UserDashboard() {
  const user = useMemo(() => (Session.isLoggedIn() ? Session.getUser() : null), []);
  const [activeTab, setActiveTab] = useState("info");
  const [menuOpen, setMenuOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Xử lý activeTab từ state khi navigate về
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất tài khoản?")) {
      Session.clearUser();
      navigate("/login");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-3xl">
            🔒
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Yêu Cầu Đăng Nhập</h2>
          <p className="text-sm text-slate-500 mb-6">
            Bạn cần đăng nhập tài khoản để truy cập bảng điều khiển thành viên CoolShop.
          </p>
          <Link
            to="/login"
            className="block w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 transition"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      id: "info",
      label: "Thông tin cá nhân",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      badge: "Hồ sơ"
    },
    {
      id: "orders",
      label: "Đơn hàng của tôi",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      badge: "Lịch sử"
    },
    {
      id: "addressList",
      label: "Sổ địa chỉ giao nhận",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      id: "manageAddress",
      label: "Thêm & Cập nhật địa chỉ",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    {
      id: "password",
      label: "Bảo mật & Đổi mật khẩu",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    }
  ];

  const getPageInfo = () => {
    switch (activeTab) {
      case "info":
        return {
          title: "Hồ Sơ Cá Nhân",
          subtitle: "Quản lý thông tin tài khoản và quyền lợi thành viên CoolClub",
          icon: "👤"
        };
      case "orders":
        return {
          title: "Đơn Hàng Của Tôi",
          subtitle: "Theo dõi hành trình đơn hàng, trạng thái thanh toán và lịch sử mua sắm",
          icon: "🛍️"
        };
      case "addressList":
        return {
          title: "Sổ Địa Chỉ Nhận Hàng",
          subtitle: "Danh sách các địa chỉ giao hàng tiện lợi và bảo mật",
          icon: "📍"
        };
      case "manageAddress":
        return {
          title: "Quản Lý & Cập Nhật Địa Chỉ",
          subtitle: "Thêm mới hoặc chỉnh sửa thông tin giao nhận nhanh chóng",
          icon: "🏠"
        };
      case "password":
        return {
          title: "Bảo Mật & Mật Khẩu",
          subtitle: "Thay đổi mật khẩu đăng nhập định kỳ để bảo vệ tài khoản",
          icon: "🛡️"
        };
      default:
        return {
          title: "Bảng Điều Khiển",
          subtitle: "Quản lý tài khoản CoolShop",
          icon: "⚡"
        };
    }
  };

  const pageInfo = getPageInfo();
  const userInitial = (user.username || "U").charAt(0).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100/70 font-sans" style={{ position: "fixed", inset: 0, margin: 0, padding: 0 }}>
      {/* Backdrop for Mobile */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out z-40 ${
          menuOpen ? "w-72" : "w-0 lg:w-20"
        } overflow-hidden shadow-2xl`}
        style={{ position: "fixed", top: 0, left: 0, bottom: 0 }}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/30 group-hover:scale-105 transition">
              ⚡
            </div>
            {menuOpen && (
              <div className="overflow-hidden">
                <span className="block font-black text-white text-base tracking-wider uppercase leading-none">
                  COOLSHOP
                </span>
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1 block">
                  Member Club
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={menuOpen ? "Thu gọn menu" : "Mở rộng menu"}
          >
            <svg className={`w-5 h-5 transition-transform duration-300 ${!menuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* User Mini Profile Card in Sidebar */}
        {menuOpen ? (
          <div className="p-4 mx-4 my-4 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-800/40 border border-slate-700/60 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-extrabold text-lg shadow-md flex-shrink-0">
              {userInitial}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-sm font-bold text-white truncate">{user.username}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wide">
                  Hội viên CoolClub
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 flex justify-center my-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {userInitial}
            </div>
          </div>
        )}

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1.5 py-2">
          {menuOpen && (
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Quản lý tài khoản
            </p>
          )}
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={!menuOpen ? item.label : undefined}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/70"
                }`}
              >
                <span className={`${isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400"} flex-shrink-0`}>
                  {item.icon}
                </span>
                {menuOpen && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {menuOpen && item.badge && !isActive && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    {item.badge}
                  </span>
                )}
                {isActive && !menuOpen && (
                  <span className="absolute right-1 w-1.5 h-6 bg-white rounded-full"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-800/80 space-y-1 bg-slate-950/40">
          <Link
            to="/"
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 transition"
            title="Quay lại cửa hàng"
          >
            <span className="text-base flex-shrink-0">🏪</span>
            {menuOpen && <span className="truncate">Về trang mua sắm</span>}
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
            title="Đăng xuất"
          >
            <span className="text-base flex-shrink-0">🚪</span>
            {menuOpen && <span className="truncate">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          marginLeft: menuOpen ? "288px" : "80px"
        }}
      >
        {/* Top Header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex-shrink-0 shadow-sm z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{pageInfo.icon}</span>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {pageInfo.title}
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 hidden sm:block">
                  {pageInfo.subtitle}
                </p>
              </div>
            </div>

            {/* Right Quick Info */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-slate-500">Xin chào,</span>
                <span className="text-sm font-black text-slate-900">{user.username}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-base shadow-md shadow-blue-500/20">
                {userInitial}
              </div>
              <Link
                to="/cart"
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition flex items-center justify-center"
                title="Giỏ hàng của tôi"
              >
                <span className="text-base">🛒</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/80">
          <div className="max-w-6xl mx-auto">
            {activeTab === "info" && <UserInfo onNavigate={setActiveTab} />}
            {activeTab === "orders" && <OrderManager onNavigate={setActiveTab} />}
            {activeTab === "addressList" && <Address onNavigate={setActiveTab} />}
            {activeTab === "manageAddress" && <ManageAddress onNavigate={setActiveTab} />}
            {activeTab === "password" && <ChangePassword onNavigate={setActiveTab} />}
          </div>
        </main>
      </div>
    </div>
  );
}