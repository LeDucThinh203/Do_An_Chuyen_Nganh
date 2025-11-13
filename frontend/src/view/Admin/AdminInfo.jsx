import React, { useMemo } from "react";
import Session from "../../Session/session";

export default function AdminInfo() {
  const user = useMemo(() => {
    return Session.isLoggedIn() ? Session.getUser() : null;
  }, []);

  if (!user)
    return <div className="text-red-500 font-bold text-center mt-10">⚠️ Vui lòng đăng nhập</div>;
  if (user.role !== "admin")
    return <div className="text-red-500 font-bold text-center mt-10">🚫 Bạn không có quyền truy cập trang này</div>;

  return (
    <div className="w-full">
      <div className="bg-white shadow-lg rounded-2xl p-8">
        <div className="border-b pb-6 mb-6">
          <h2 className="text-3xl font-bold text-blue-600 mb-8">
            👤 Thông tin tài khoản quản trị
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">ID</p>
              <p className="text-lg font-semibold text-gray-800">{user.id}</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Email người dùng</p>
              <p className="text-lg font-semibold text-gray-800">{user.email || "Chưa có email"}</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Tên người dùng</p>
              <p className="text-lg font-semibold text-gray-800">{user.username}</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Vai trò</p>
              <p className="text-lg font-semibold text-gray-800">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {user.role}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
