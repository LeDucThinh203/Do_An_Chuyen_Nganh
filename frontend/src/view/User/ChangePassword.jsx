// src/view/User/ChangePassword.jsx
import React, { useState } from "react";
import Session from "../../Session/session";
import * as api from "../../api";

export default function ChangePassword() {
  const user = Session.isLoggedIn() ? JSON.parse(localStorage.getItem("user")) : null;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Vui lòng điền đầy đủ tất cả các trường mật khẩu.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới và mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setLoading(true);
      await api.updateAccount(user.id, { currentPassword, password: newPassword });
      setMessage("Đổi mật khẩu thành công! Tài khoản của bạn đã được bảo vệ với mật khẩu mới.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi khi đổi mật khẩu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Security Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        {/* Card Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-xl shadow-lg shadow-purple-500/20 flex-shrink-0">
            🛡️
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Đổi Mật Khẩu Tài Khoản</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Để bảo vệ tài khoản, hãy sử dụng mật khẩu mạnh kết hợp chữ, số và ký tự đặc biệt.
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-start gap-3 text-rose-700 text-sm">
            <span className="text-base flex-shrink-0">⚠️</span>
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3 text-emerald-700 text-sm">
            <span className="text-base flex-shrink-0">✅</span>
            <div className="flex-1 font-medium">{message}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleChangePassword} className="space-y-5">
          {/* Field 1: Mật khẩu hiện tại */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Mật khẩu hiện tại
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                placeholder="Nhập mật khẩu bạn đang dùng"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition pr-12"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
                title={showCurrent ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showCurrent ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          {/* Field 2: Mật khẩu mới */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition pr-12"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
                title={showNew ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showNew ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          {/* Field 3: Xác nhận mật khẩu */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition pr-12"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
                title={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showConfirm ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          {/* Guidelines checklist */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs text-slate-600">
            <p className="font-bold text-slate-800">Yêu cầu bảo mật mật khẩu:</p>
            <div className="flex items-center gap-2">
              <span className={newPassword.length >= 6 ? "text-emerald-600" : "text-slate-400"}>
                {newPassword.length >= 6 ? "✓" : "•"}
              </span>
              <span>Độ dài tối thiểu từ 6 ký tự trở lên</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={newPassword && newPassword === confirmPassword ? "text-emerald-600" : "text-slate-400"}>
                {newPassword && newPassword === confirmPassword ? "✓" : "•"}
              </span>
              <span>Mật khẩu mới và mật khẩu xác nhận trùng khớp</span>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Đang xử lý đổi mật khẩu...</span>
              </>
            ) : (
              <>
                <span>Xác nhận đổi mật khẩu</span>
                <span>🔒</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
