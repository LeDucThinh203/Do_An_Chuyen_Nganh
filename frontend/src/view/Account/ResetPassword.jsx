import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as api from "../../api";
import { LockClosedIcon } from "@heroicons/react/24/solid";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await api.resetPassword(token, password);
      setMessage(res.message || "Đặt lại mật khẩu thành công!");
      
      // Hiển thị thông báo đang chuyển trang
      setTimeout(() => {
        setMessage("🎉 Đang chuyển sang trang đăng nhập...");
      }, 500);

      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.message || "Không thể đặt lại mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="bg-white shadow-xl rounded-3xl w-full max-w-[1200px] p-12 relative">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-blue-600">
          Đặt lại mật khẩu
        </h2>

        {message && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-center transition-all duration-500">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center transition-all duration-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          <div className="relative w-full">
            <LockClosedIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="password"
              placeholder="Nhập mật khẩu mới"
              className="w-full pl-14 pr-4 py-4 border border-gray-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-gray-700 text-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className={`w-full py-4 rounded-3xl text-white font-semibold shadow-md transition transform hover:scale-105 text-lg ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={loading}
          >
            {loading ? "⏳ Đang xác nhận..." : "Xác nhận"}
          </button>
        </form>

        <p
          className="mt-6 text-center text-gray-500 cursor-pointer hover:underline text-lg"
          onClick={() => navigate("/login")}
        >
          Quay lại đăng nhập
        </p>
      </div>
    </div>
  );
}
