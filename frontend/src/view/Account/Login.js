import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as api from "../../api";
import Session from "../../Session/session";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Gọi API login, backend phải trả về {id, username, role, email}
      const user = await api.login({ email, password });
      if (user && user.id) {
        // Lưu email vào session
        Session.setUser(user.id, user.username, user.role, user.email);

        // Lưu state trong React nếu cần
        setUser(user);

        navigate("/");
      } else {
        setError("Email hoặc mật khẩu không đúng");
      }
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
          Login
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>

        <p className="mt-2 text-center">
          <Link to="/forgot-password" className="text-blue-500 hover:underline">
            Quên mật khẩu?
          </Link>
        </p>

        <p className="mt-4 text-center">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="text-green-600 font-semibold">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}
