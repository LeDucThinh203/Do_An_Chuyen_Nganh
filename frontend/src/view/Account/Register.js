import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as api from "../../api";
import { EnvelopeIcon, UserIcon, LockClosedIcon } from "@heroicons/react/24/solid";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Mật khẩu và xác nhận mật khẩu không khớp");
      return;
    }

    setLoading(true);
    try {
      const user = await api.register({ email, username, password, role: "user" });
      if (user && user.id) {
        setSuccess("Đăng ký thành công! Chuyển sang trang login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError("Đăng ký thất bại, thử lại sau!");
      }
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4 relative overflow-hidden">
      {/* Background decorative circles */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-green-200 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-30 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-green-300 rounded-full translate-x-1/3 translate-y-1/3 opacity-20 pointer-events-none"></div>

      <div className="bg-white shadow-xl rounded-3xl w-full max-w-6xl p-10 flex flex-col md:flex-row items-center gap-8 relative z-10">
        {/* Left side illustration */}
        <div className="hidden md:flex flex-1 justify-center">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3064/3064197.png"
            alt="Register Illustration"
            className="w-72 h-72 object-contain"
          />
        </div>

        {/* Form */}
        <div className="flex-1 w-full max-w-2xl">
          <div className="flex flex-col items-center mb-4">
            <h2 className="text-3xl font-bold text-green-600 mb-1 text-center">Đăng ký</h2>
            <p className="text-gray-500 text-sm text-center">
              Tạo tài khoản để bắt đầu trải nghiệm
            </p>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 text-green-700 p-2 rounded mb-3 text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <EnvelopeIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="Email"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400 transition text-gray-700"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Username"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400 transition text-gray-700"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <LockClosedIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                placeholder="Mật khẩu"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400 transition text-gray-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <LockClosedIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                placeholder="Xác nhận mật khẩu"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400 transition text-gray-700"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-2xl text-white font-semibold shadow-md transition transform hover:scale-105 ${
                loading
                  ? "bg-green-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
              disabled={loading}
            >
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </button>
          </form>

          <div className="flex justify-center mt-4 text-sm text-gray-500 relative z-20">
            <Link to="/login" className="hover:underline text-blue-500 font-semibold">
              Đã có tài khoản? Đăng nhập
            </Link>
          </div>

          <p className="mt-6 text-center text-gray-400 text-xs relative z-20">
            &copy; 2025 CoolShop. Bản quyền thuộc về CoolShop.
          </p>
        </div>
      </div>
    </div>
  );
}
