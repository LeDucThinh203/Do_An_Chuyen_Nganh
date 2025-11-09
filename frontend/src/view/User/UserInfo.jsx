import React, { useMemo } from "react";
import Session from "../../Session/session";

export default function UserInfo() {
  const user = useMemo(() => {
    return Session.isLoggedIn() ? Session.getUser() : null;
  }, []);

  if (!user)
    return <div className="text-red-500 font-bold text-center mt-10">⚠️ Vui lòng đăng nhập</div>;

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-2xl space-y-8">
      <div className="border-b pb-6">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-4">
          👤 Thông tin cá nhân
        </h2>
        <div className="space-y-2 text-gray-700 text-center">
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email || "Chưa có email"}</p>
          <p><strong>Tên người dùng:</strong> {user.username}</p>
          <p><strong>Vai trò:</strong> {user.role}</p>
        </div>
      </div>
    </div>
  );
}
