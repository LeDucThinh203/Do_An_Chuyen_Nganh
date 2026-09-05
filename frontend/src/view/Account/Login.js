// src/view/Account/Login.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as api from "../../api";
import Session from "../../Session/session";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await api.login({ email, password });
      if (user && user.id && user.token) {
        Session.setUser(user.id, user.username, user.role, user.email, user.token);
        setUser(user);
        navigate("/");
      } else {
        setError("Email hoặc mật khẩu không chính xác.");
      }
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi đăng nhập. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/60 to-indigo-50/40 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Radiant light ambient background bubbles */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-300/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl shadow-blue-500/10 border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        {/* Left Side: Radiant Royal Athletic Banner */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden shadow-inner">
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-cyan-400/25 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

          <div>
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-xl shadow-md group-hover:scale-105 transition">
                ⚡
              </div>
              <span className="font-black text-xl tracking-wider uppercase drop-shadow">COOLSHOP</span>
            </Link>

            <div className="mt-12 space-y-3.5">
              <span className="inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm">
                Pro Athletic 2026
              </span>
              <h1 className="text-2xl sm:text-3xl font-black leading-tight drop-shadow-sm">
                Chào Mừng Bạn <br />
                <span className="text-cyan-200">
                  Trở Lại CoolShop
                </span>
              </h1>
              <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
                Đăng nhập để nhận ngay ưu đãi hội viên CoolClub, theo dõi đơn hàng và tận hưởng trải nghiệm mua sắm đồ thể thao đỉnh cao.
              </p>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/20 space-y-2.5 text-xs text-blue-100">
            <div className="flex items-center gap-2">
              <span className="text-base">🚀</span>
              <span>Giao hàng hỏa tốc 2h - Miễn phí đơn từ 299K</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">🛡️</span>
              <span>Đổi trả 60 ngày miễn phí tận nơi an tâm</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">✨</span>
              <span>Tặng voucher 10% cho thành viên CoolClub</span>
            </div>
          </div>
        </div>

        {/* Right Side: Clean Bright Form */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between bg-white">
          <div>
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Đăng Nhập
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Nhập thông tin tài khoản của bạn để tiếp tục
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    ✉️
                  </span>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition font-medium text-slate-800"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Mật khẩu
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    🔒
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition font-medium text-slate-800"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01]"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang xác thực đăng nhập...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng Nhập Ngay</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <span>Chưa có tài khoản CoolShop?</span>
            <Link
              to="/register"
              className="font-bold text-blue-600 hover:text-indigo-600 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100/70 transition"
            >
              Đăng ký tài khoản mới →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
