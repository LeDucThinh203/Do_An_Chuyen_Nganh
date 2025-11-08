import React, { useState } from "react";
import Session from "../../Session/session";
import * as api from "../../api";

export default function ChangePassword() {
  const user = Session.isLoggedIn() ? JSON.parse(localStorage.getItem("user")) : null;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage(""); setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới và xác nhận không khớp.");
      return;
    }

    try {
      await api.updateAccount(user.id, { currentPassword, password: newPassword });
      setMessage("Đổi mật khẩu thành công!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi khi đổi mật khẩu.");
    }
  };

  return (
    <div className="bg-white shadow-md rounded p-6">
      <h2 className="text-2xl font-bold mb-4">Đổi mật khẩu</h2>
      {error && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{error}</div>}
      {message && <div className="bg-green-100 text-green-700 p-2 mb-4 rounded">{message}</div>}
      <form onSubmit={handleChangePassword} className="space-y-4">
        <input type="password" placeholder="Mật khẩu hiện tại" className="w-full p-2 border rounded"
          value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
        <input type="password" placeholder="Mật khẩu mới" className="w-full p-2 border rounded"
          value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        <input type="password" placeholder="Xác nhận mật khẩu mới" className="w-full p-2 border rounded"
          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Đổi mật khẩu
        </button>
      </form>
    </div>
  );
}
