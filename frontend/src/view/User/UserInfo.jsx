import React from "react";
import Session from "../../Session/session";

export default function UserInfo() {
  const user = Session.isLoggedIn() ? JSON.parse(localStorage.getItem("user")) : null;

  if (!user) return <div className="text-red-500 font-bold">Vui lòng đăng nhập</div>;

  return (
    <div className="bg-white shadow-md rounded p-6">
      <h2 className="text-2xl font-bold mb-4">Thông tin cá nhân</h2>
      <p><strong>ID:</strong> {user.id}</p>
      <p><strong>Username:</strong> {user.username}</p>
      <p><strong>Role:</strong> {user.role}</p>
    </div>
  );
}
