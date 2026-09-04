// src/view/Header/Header.js
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Header() {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Cập nhật số lượng sản phẩm trong giỏ hàng
  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    setCartCount(totalItems);
  };

  // Lấy user từ localStorage khi component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    updateCartCount();
    
    const handleStorageChange = (e) => {
      if (e.key === "cart") {
        updateCartCount();
      }
      if (e.key === "user") {
        setUser(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(updateCartCount, 1000);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setDropdownOpen(false);
    navigate("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white text-[12px] sm:text-xs py-1.5 px-4 font-medium tracking-wide">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <span className="inline-flex items-center justify-center bg-blue-500/30 text-blue-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-blue-400/30">
              Ưu đãi
            </span>
            <span>🔥 FREESHIP TOÀN QUỐC CHO ĐƠN TỪ 299K • ĐỔI TRẢ 60 NGÀY TẬN NƠI</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-slate-300 text-xs">
            <Link to="/" className="hover:text-white transition">Hỗ trợ 24/7</Link>
            <span className="text-slate-600">•</span>
            <Link to="/" className="hover:text-white transition">Tra cứu đơn hàng</Link>
          </div>
        </div>
      </div>

      {/* Main Glassmorphism Navbar */}
      <nav className="glass-nav border-b border-slate-200/70 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Brand Identity */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 transform -rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-blue-700 bg-clip-text text-transparent">
                COOLSHOP
              </span>
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold -mt-1">
                Pro Athletic
              </span>
            </div>
          </Link>

          {/* Quick Nav links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link to="/" className="hover:text-blue-600 transition flex items-center gap-1.5 py-1">
              <span>Trang chủ</span>
            </Link>
            <Link to="/" className="hover:text-blue-600 transition flex items-center gap-1.5 py-1">
              <span>Sản phẩm</span>
            </Link>
            <Link to="/" className="hover:text-rose-600 transition flex items-center gap-1.5 py-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-rose-600 font-bold">Khuyến mãi Hot</span>
            </Link>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Cart Button */}
            <Link
              to="/cart"
              className="relative p-2.5 text-slate-700 hover:text-blue-600 hover:bg-blue-50/80 rounded-full transition duration-200 flex items-center justify-center group"
              title="Giỏ hàng"
            >
              <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 ? (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-md shadow-red-500/30 badge-pulse">
                  {cartCount}
                </span>
              ) : null}
            </Link>

            {/* User Profile / Auth State */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200/80 hover:border-blue-300 hover:bg-slate-50/80 transition shadow-sm bg-white"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center uppercase shadow-sm">
                    {user.username ? user.username.charAt(0) : "U"}
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-700 max-w-[100px] truncate">
                    {user.username}
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                    {user.role === "admin" ? "Admin" : "Member"}
                  </span>
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180 text-blue-600" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-60 bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2.5 border-b border-slate-100 mb-1">
                      <p className="text-xs text-slate-400 font-medium">Tài khoản đăng nhập</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{user.username}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {user.role === "admin" ? "Quản trị viên hệ thống" : "Khách hàng thân thiết"}
                      </span>
                    </div>

                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span className="text-base">⚡</span>
                        <span>Trang Quản Trị (Admin)</span>
                      </Link>
                    )}

                    <Link
                      to="/user"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <span className="text-base">👤</span>
                      <span>Hồ sơ & Đơn mua</span>
                    </Link>

                    <div className="my-1 border-t border-slate-100"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition"
                    >
                      <span className="text-base">🚪</span>
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-100/70 rounded-full transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-full shadow-md shadow-blue-500/20 hover:shadow-lg transition duration-200"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
