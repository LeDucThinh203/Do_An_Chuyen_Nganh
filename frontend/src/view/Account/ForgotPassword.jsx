// src/view/Account/ForgotPassword.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as api from "../../api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await api.forgotPassword(email);
      setMessage(res.message || "Email khôi phục mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư của bạn.");
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/60 to-indigo-50/40 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Radiant light ambient background orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-blue-500/10 border border-slate-200/80 p-8 sm:p-10 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-blue-500/25">
            🔑
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Quên Mật Khẩu?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-sm mx-auto">
            Nhập địa chỉ email liên kết với tài khoản của bạn để nhận liên kết đặt lại mật khẩu an toàn.
          </p>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2.5">
            <span>✅</span>
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Địa chỉ Email tài khoản
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                ✉️
              </span>
              <input
                type="email"
                placeholder="Nhập email của bạn"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition font-medium text-slate-800"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01]"
          >
            {loading ? (
              <span>Đang gửi liên kết...</span>
            ) : (
              <>
                <span>Gửi Email Khôi Phục</span>
                <span>📤</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
          >
            <span>←</span>
            <span>Quay lại trang Đăng nhập</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
