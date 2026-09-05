// src/view/Account/Register.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as api from "../../api";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Mật khẩu phải có độ dài tối thiểu từ 6 ký tự trở lên.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu và mật khẩu xác nhận không trùng khớp.");
      return;
    }

    setLoading(true);
    try {
      const user = await api.register({ email, username, password, role: "user" });
      if (user && user.id) {
        setSuccess("🎉 Đăng ký tài khoản thành công! Đang chuyển sang đăng nhập...");
        setTimeout(() => navigate("/login"), 1800);
      } else {
        setError("Đăng ký không thành công. Vui lòng kiểm tra lại thông tin!");
      }
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi đăng ký. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/50 to-teal-50/40 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Radiant light ambient background orbs */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-200/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl shadow-emerald-500/10 border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        {/* Left Side: Brand Showcase */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden shadow-inner">
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-cyan-300/25 rounded-full blur-2xl pointer-events-none"></div>

          <div>
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-xl shadow-md group-hover:scale-105 transition">
                ⚡
              </div>
              <span className="font-black text-xl tracking-wider uppercase drop-shadow">COOLSHOP</span>
            </Link>

            <div className="mt-12 space-y-3.5">
              <span className="inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm">
                Gia Nhập CoolClub
              </span>
              <h1 className="text-2xl sm:text-3xl font-black leading-tight drop-shadow-sm">
                Khởi Đầu Hành Trình <br />
                <span className="text-cyan-200">
                  Đẳng Cấp Thể Thao
                </span>
              </h1>
              <p className="text-emerald-50 text-xs sm:text-sm leading-relaxed">
                Tạo tài khoản ngay hôm nay để nhận voucher giảm giá 10% đơn đầu tiên và tích lũy điểm thưởng thành viên thân thiết.
              </p>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/20 space-y-2.5 text-xs text-emerald-50">
            <div className="flex items-center gap-2">
              <span className="text-base">🎁</span>
              <span>Tặng ngay Voucher 10% chào đón thành viên mới</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <span>Thông báo sớm nhất các bộ sưu tập thể thao 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">🔒</span>
              <span>Bảo mật dữ liệu cá nhân theo chuẩn quốc tế</span>
            </div>
          </div>
        </div>

        {/* Right Side: Register Form */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between bg-white">
          <div>
            <div className="mb-5">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Đăng Ký Tài Khoản
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Điền thông tin để tạo tài khoản thành viên mới
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2.5">
                <span>✅</span>
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Địa chỉ Email *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    ✉️
                  </span>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition font-medium text-slate-800"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Tên người dùng (Username) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    👤
                  </span>
                  <input
                    type="text"
                    placeholder="Tên tài khoản viết liền hoặc có dấu"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition font-medium text-slate-800"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Mật khẩu *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    🔒
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full pl-11 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition font-medium text-slate-800"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition"
                  >
                    {showPassword ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Xác nhận lại mật khẩu *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    🛡️
                  </span>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full pl-11 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition font-medium text-slate-800"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition"
                  >
                    {showConfirm ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01]"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang khởi tạo tài khoản...</span>
                  </>
                ) : (
                  <>
                    <span>Hoàn Tất Đăng Ký</span>
                    <span>✨</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <span>Đã có tài khoản CoolShop?</span>
            <Link
              to="/login"
              className="font-bold text-emerald-600 hover:text-teal-700 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/70 transition"
            >
              Đăng nhập ngay →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
