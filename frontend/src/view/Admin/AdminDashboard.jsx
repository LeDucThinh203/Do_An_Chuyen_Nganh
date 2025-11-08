import React, { useState, useMemo } from "react";
import AdminInfo from "./AdminInfo";
import AdminAddressManager from "./AdminAddressManager";
import Session from "../../Session/session";

export default function AdminDashboard() {
  const user = useMemo(
    () => (Session.isLoggedIn() ? JSON.parse(localStorage.getItem("user")) : null),
    []
  );
  const [activeTab, setActiveTab] = useState("info");

  if (!user)
    return <div className="text-red-500 font-bold text-center mt-20">⚠️ Vui lòng đăng nhập để truy cập trang quản trị</div>;

  if (user.role !== "admin")
    return <div className="text-red-500 font-bold text-center mt-20">🚫 Bạn không có quyền truy cập trang quản trị</div>;

  return (
    <div className="max-w-6xl mx-auto mt-20 flex gap-6">
      {/* Sidebar */}
      <div className="flex flex-col w-52 bg-gray-100 p-4 rounded shadow-md space-y-4">
        <button
          className={`p-2 rounded ${
            activeTab === "info"
              ? "bg-blue-600 text-white"
              : "hover:bg-blue-200"
          }`}
          onClick={() => setActiveTab("info")}
        >
          Thông tin người dùng
        </button>
        <button
          className={`p-2 rounded ${
            activeTab === "address"
              ? "bg-blue-600 text-white"
              : "hover:bg-blue-200"
          }`}
          onClick={() => setActiveTab("address")}
        >
          Quản lý địa chỉ
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {activeTab === "info" && <AdminInfo />}
        {activeTab === "address" && <AdminAddressManager />}
      </div>
    </div>
  );
}
