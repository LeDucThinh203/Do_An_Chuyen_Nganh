import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as api from "../../api";
import Session from "../../Session/session";
import { EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/solid";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        setError("Email hoặc mật khẩu không đúng");
      }
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4 relative overflow-hidden">
      {/* Background decorative circles */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-blue-200 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-30 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-300 rounded-full translate-x-1/3 translate-y-1/3 opacity-20 pointer-events-none"></div>

      <div className="bg-white shadow-2xl rounded-3xl w-full max-w-5xl p-12 flex flex-col md:flex-row items-center gap-10 relative z-10">
        {/* Left side illustration / info (optional) */}
        <div className="hidden md:flex flex-1 justify-center">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3064/3064197.png"
            alt="Login Illustration"
            className="w-80 h-80 object-contain"
          />
        </div>

        {/* Form */}
        <div className="flex-1 w-full max-w-xl">
          <div className="flex flex-col items-center mb-6">
            <h2 className="text-4xl font-bold text-blue-600 mb-2 text-center">Đăng nhập</h2>
            <p className="text-gray-500 text-sm text-center">
              Nhập thông tin tài khoản của bạn để tiếp tục
            </p>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <EnvelopeIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="Email"
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-gray-700"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <LockClosedIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                placeholder="Mật khẩu"
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-gray-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className={`w-full py-4 rounded-2xl text-white font-semibold shadow-md transition transform hover:scale-105 ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={loading}
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <div className="flex justify-between mt-4 text-sm text-gray-500 relative z-20">
            <Link to="/forgot-password" className="hover:underline text-blue-500">
              Quên mật khẩu?
            </Link>
            <Link to="/register" className="hover:underline text-green-600 font-semibold">
              Đăng ký
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
