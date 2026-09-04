// src/view/Footer/Footer.js
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const location = useLocation();

  const isAdminPath =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/categories") ||
    location.pathname === "/add" ||
    location.pathname.startsWith("/add/") ||
    location.pathname.startsWith("/edit");

  if (isAdminPath) {
    return null;
  }

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail("");
      }, 4000);
    }
  };

  return (
    <footer className="bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-300 pt-16 pb-12 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Newsletter & Club VIP Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/60 via-indigo-950/80 to-slate-900/90 border border-blue-500/20 p-8 sm:p-12 mb-16 shadow-2xl backdrop-blur-sm">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-400/30">
                ✨ ĐẶC QUYỀN HỘI VIÊN COOLCLUB
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Nhận ngay Voucher <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400 font-black">10% GIẢM GIÁ</span> cho đơn hàng đầu tiên
              </h2>
              <p className="text-slate-400 text-sm sm:text-base max-w-xl">
                Cập nhật sớm nhất các bộ sưu tập giới hạn, bí quyết phối đồ thể thao thời thượng và ngập tràn voucher quà tặng bí mật mỗi tuần.
              </p>
            </div>

            <div className="lg:col-span-5">
              {subscribed ? (
                <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-4 text-center">
                  <p className="text-emerald-400 font-bold text-sm">🎉 Chúc mừng bạn đã đăng ký thành công!</p>
                  <p className="text-xs text-slate-300 mt-1">Mã giảm giá 10% đã được gửi vào hòm thư của bạn.</p>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập địa chỉ email của bạn..."
                    className="flex-1 bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-inner"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all duration-200 whitespace-nowrap hover:scale-102"
                  >
                    Nhận Ưu Đãi
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* 4 Pillars Trust Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-slate-800/80 mb-12">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-xl flex-shrink-0 border border-blue-500/20">
              🚀
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Giao Hàng Siêu Tốc</h4>
              <p className="text-xs text-slate-400">Nội thành trong 2-4 giờ</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl flex-shrink-0 border border-amber-500/20">
              🔄
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Đổi Trả 60 Ngày</h4>
              <p className="text-xs text-slate-400">Miễn phí đổi hàng tận nơi</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl flex-shrink-0 border border-emerald-500/20">
              💎
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">100% Chính Hãng</h4>
              <p className="text-xs text-slate-400">Vải công nghệ cao cấp</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xl flex-shrink-0 border border-purple-500/20">
              🎧
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Hỗ Trợ 24/7</h4>
              <p className="text-xs text-slate-400">Hotline 1900 272737</p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12">
          
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <svg className="w-6 h-6 transform -rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-black tracking-tight text-white">COOLSHOP</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Thương hiệu thời trang thể thao và phong cách sống hiện đại. Tiên phong ứng dụng chất liệu thông minh, thân thiện với môi trường, mang lại cảm giác thoải mái nhất cho người Việt.
            </p>
            
            <div className="pt-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Kết nối với chúng tôi</p>
              <div className="flex items-center gap-3">
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-blue-600 text-white flex items-center justify-center transition-all duration-200 hover:-translate-y-1">
                  f
                </a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-pink-600 text-white flex items-center justify-center transition-all duration-200 hover:-translate-y-1">
                  📸
                </a>
                <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-all duration-200 hover:-translate-y-1">
                  🎵
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-red-600 text-white flex items-center justify-center transition-all duration-200 hover:-translate-y-1">
                  ▶
                </a>
              </div>
            </div>
          </div>

          {/* Col 2: Về COOLSHOP */}
          <div>
            <h3 className="text-white font-bold text-sm tracking-wide uppercase mb-4">Về COOLSHOP</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="text-slate-400 hover:text-white transition">Câu chuyện thương hiệu</Link></li>
              <li><Link to="/" className="text-slate-400 hover:text-white transition">Nhà máy & Công nghệ dệt</Link></li>
              <li><Link to="/" className="text-slate-400 hover:text-white transition">Care & Share cộng đồng</Link></li>
              <li><Link to="/" className="text-slate-400 hover:text-white transition">Tuyển dụng nhân tài</Link></li>
              <li><Link to="/" className="text-slate-400 hover:text-white transition">Cam kết phát triển bền vững</Link></li>
            </ul>
          </div>

          {/* Col 3: Chính Sách */}
          <div>
            <h3 className="text-white font-bold text-sm tracking-wide uppercase mb-4">Chính Sách & Dịch Vụ</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="text-slate-400 hover:text-white transition">Chính sách đổi trả 60 ngày</Link></li>
              <li><Link to="/" className="text-slate-400 hover:text-white transition">Chính sách vận chuyển siêu tốc</Link></li>
              <li><Link to="/" className="text-slate-400 hover:text-white transition">Chính sách bảo mật thông tin</Link></li>
              <li><Link to="/" className="text-slate-400 hover:text-white transition">Hướng dẫn chọn size chuẩn xác</Link></li>
              <li><Link to="/" className="text-slate-400 hover:text-white transition">Câu hỏi thường gặp (FAQs)</Link></li>
            </ul>
          </div>

          {/* Col 4: Thanh toán & Chứng nhận */}
          <div>
            <h3 className="text-white font-bold text-sm tracking-wide uppercase mb-4">Phương Thức Thanh Toán</h3>
            <p className="text-xs text-slate-400 mb-3">Hỗ trợ đa dạng phương thức thanh toán bảo mật 100%:</p>
            <div className="grid grid-cols-3 gap-2 text-xs font-bold text-slate-300">
              <span className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-center">VNPay</span>
              <span className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-center">Visa</span>
              <span className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-center">Master</span>
              <span className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-center">MoMo</span>
              <span className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-center">ZaloPay</span>
              <span className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-center">COD</span>
            </div>
            <div className="mt-4 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 flex items-center gap-2">
              <span>🔒</span>
              <span>Bảo mật giao dịch SSL 256-bit</span>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-800/80 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2025 COOLSHOP Vietnam. All rights reserved. Bản quyền thuộc về CoolShop Athletic.</p>
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-slate-300 transition">Điều khoản sử dụng</Link>
            <Link to="/" className="hover:text-slate-300 transition">Chính sách bảo mật</Link>
            <Link to="/" className="hover:text-slate-300 transition">Sơ đồ website</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
