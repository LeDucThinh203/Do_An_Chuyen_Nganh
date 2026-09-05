// src/view/Footer/Footer.js
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const location = useLocation();

  const isDashboardPath =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/user") ||
    location.pathname.startsWith("/categories") ||
    location.pathname === "/add" ||
    location.pathname.startsWith("/add/") ||
    location.pathname.startsWith("/edit");

  if (isDashboardPath) {
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
    <footer 
      className="relative z-20 w-full text-slate-300 pt-16 pb-12 border-t border-slate-800 shadow-2xl mt-auto"
      style={{ backgroundColor: "#070c18" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 1. Newsletter & Club VIP Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950/90 via-indigo-950/90 to-slate-900 border border-blue-500/30 p-8 sm:p-10 mb-14 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-2.5">
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

        {/* 2. 4 Pillars Trust Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-7 border-y border-slate-800/80 mb-12">
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

        {/* 3. Original 5 Content Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 pb-12">
          
          {/* Column 1: Đóng góp ý kiến & Mạng xã hội */}
          <div className="space-y-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Đóng góp ý kiến</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Chúng tôi luôn trân trọng và mong đợi nhận được mọi ý kiến đóng góp từ khách hàng để nâng cấp trải nghiệm dịch vụ và sản phẩm tốt hơn nữa.
            </p>
            <div className="pt-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Kênh kết nối</p>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-blue-600 text-slate-300 hover:text-white text-xs font-semibold transition border border-slate-700/60"
                >
                  Facebook
                </a>
                <a
                  href="https://zalo.me"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-blue-500 text-slate-300 hover:text-white text-xs font-semibold transition border border-slate-700/60"
                >
                  Zalo
                </a>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition border border-slate-700/60"
                >
                  TikTok
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-pink-600 text-slate-300 hover:text-white text-xs font-semibold transition border border-slate-700/60"
                >
                  Instagram
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-red-600 text-slate-300 hover:text-white text-xs font-semibold transition border border-slate-700/60"
                >
                  YouTube
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: CoolClub */}
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4">CoolClub</h3>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/" className="hover:text-white transition block">Tài khoản CoolClub</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition block">Đăng ký thành viên mới</Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition block">Ưu đãi & Đặc quyền hội viên</Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition block">Chính sách tích điểm đổi quà</Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition block">Hạng thành viên VIP</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Chính sách */}
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4">Chính sách</h3>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/" className="hover:text-white transition block">Chính sách đổi trả 60 ngày</Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition block">Chính sách khuyến mãi & voucher</Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition block">Chính sách bảo mật thông tin</Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition block">Chính sách giao hàng siêu tốc</Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition block">Hướng dẫn chọn size chuẩn xác</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Coolmate.me / CSKH */}
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4">Chăm sóc khách hàng</h3>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/" className="hover:text-white transition block">Lịch sử thay đổi website</Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition block">Trải nghiệm mua sắm 100% hài lòng</Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition block">Hỏi đáp thường gặp - FAQs</Link>
              </li>
              <li>
                <span className="text-slate-300 font-semibold">Hotline: </span>
                <a href="tel:1900272737" className="text-blue-400 hover:underline">1900 272737</a>
                <span className="text-[10px] text-slate-500 block">(8:30 - 22:00 tất cả các ngày)</span>
              </li>
              <li>
                <span className="text-slate-300 font-semibold">Email: </span>
                <a href="mailto:cskh@coolshop.vn" className="text-blue-400 hover:underline">cskh@coolshop.vn</a>
              </li>
            </ul>
          </div>

          {/* Column 5: Về COOLSHOP (Coolmate) */}
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4">Về COOLSHOP</h3>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/" className="hover:text-white transition block">Quy tắc ứng xử của CoolShop</Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition block">CoolShop 101 - Giá trị cốt lõi</Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition block">Dịch vụ khách hàng xuất sắc</Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition block">Câu chuyện về CoolShop</Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition block">Nhà máy & Công nghệ dệt</Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition block">Care & Share cộng đồng</Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition block">Cam kết phát triển bền vững</Link>
              </li>
            </ul>
          </div>

        </div>

        {/* 4. Payment Methods & Security */}
        <div className="py-6 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-bold text-white mr-2">Phương thức thanh toán:</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 font-semibold text-slate-300">VNPay</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 font-semibold text-slate-300">Visa</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 font-semibold text-slate-300">MasterCard</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 font-semibold text-slate-300">MoMo</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 font-semibold text-slate-300">ZaloPay</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 font-semibold text-slate-300">COD (Tiền mặt)</span>
          </div>


        </div>

        {/* 5. Original Detailed Company Addresses & Legal Info */}
        <div className="border-t border-slate-800/80 pt-7 pb-8 text-xs text-slate-400 space-y-2">
          <p className="font-bold text-white text-sm mb-2">Địa chỉ liên hệ và trung tâm vận hành:</p>
          <p className="leading-relaxed">
            <strong className="text-slate-300">Văn phòng Hà Nội:</strong> Tầng 3-4, Tòa nhà BMM, Km2, Đường Phùng Hưng, Phường Phúc La, Quận Hà Đông, Thành phố Hà Nội
          </p>
          <p className="leading-relaxed">
            <strong className="text-slate-300">Trung tâm vận hành Hà Nội:</strong> Lô C8, KCN Lại Yên, Xã Lại Yên, Huyện Hoài Đức, Thành phố Hà Nội
          </p>
          <p className="leading-relaxed">
            <strong className="text-slate-300">Văn phòng và Trung tâm vận hành TP.HCM:</strong> Lô C3, đường D2, KCN Cát Lái, Phường Thạnh Mỹ Lợi, TP. Thủ Đức, TP. Hồ Chí Minh
          </p>
          <p className="leading-relaxed">
            <strong className="text-slate-300">Trung tâm R&D:</strong> T6-01, The Manhattan Vinhomes Grand Park, Phường Long Bình, TP. Thủ Đức, TP. Hồ Chí Minh
          </p>
          <p className="pt-2 text-slate-500 leading-relaxed border-t border-slate-800/50 mt-3">
            © 2026 CÔNG TY TNHH FASTECH ASIA | Mã số doanh nghiệp: 0108617038 | Giấy chứng nhận đăng ký doanh nghiệp do Sở KH & ĐT TP Hà Nội cấp lần đầu ngày 20/02/2019. Bản quyền thuộc về CoolShop Pro Athletic.
          </p>
        </div>

        {/* 6. Legal links */}
        <div className="pt-4 border-t border-slate-800/60 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 COOLSHOP Vietnam. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-slate-300 transition">Điều khoản sử dụng</Link>
            <Link to="/" className="hover:text-slate-300 transition">Chính sách bảo mật</Link>
            <Link to="/" className="hover:text-slate-300 transition">Quy chế hoạt động</Link>
            <Link to="/" className="hover:text-slate-300 transition">Sơ đồ website</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
