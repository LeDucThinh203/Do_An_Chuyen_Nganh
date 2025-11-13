import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../../api";
import { EnvelopeIcon } from "@heroicons/react/24/solid";

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
      setMessage(res.message || "Email khôi phục đã được gửi! Vui lòng kiểm tra hộp thư.");
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-tr from-blue-50 to-blue-100 p-4">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-4xl p-12 relative">
        <div className="flex justify-center mb-6">
          <EnvelopeIcon className="h-16 w-16 text-blue-500" />
        </div>

        <h2 className="text-4xl font-bold mb-6 text-center text-blue-600">
          Quên mật khẩu
        </h2>

        {message && (
          <div className="bg-green-100 text-green-700 p-4 rounded mb-6 text-center">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <label className="flex-1 text-gray-700 font-medium mb-2 sm:mb-0">
              Email của bạn:
            </label>
            <input
              type="email"
              placeholder="Nhập email của bạn"
              className="flex-1 px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className={`w-full py-4 rounded-2xl text-white font-semibold shadow-md transition ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={loading}
          >
            {loading ? "Đang gửi..." : "Gửi email khôi phục"}
          </button>
        </form>

        <p
          className="mt-8 text-center text-gray-500 cursor-pointer hover:underline"
          onClick={() => navigate("/login")}
        >
          Quay lại đăng nhập
        </p>
      </div>
    </div>
  );
}
