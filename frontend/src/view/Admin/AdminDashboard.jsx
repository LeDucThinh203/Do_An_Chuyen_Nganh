import React, { useState, useMemo } from "react";
import AdminInfo from "./AdminInfo";
import AdminAddressManager from "./AdminAddressManager";
import UserManager from "./UserManager";
import Session from "../../Session/session";

export default function AdminDashboard() {
  const user = useMemo(() => (Session.isLoggedIn() ? Session.getUser() : null), []);
  const [activeTab, setActiveTab] = useState("info");

  if (!user)
    return (
      <div className="text-red-500 font-bold text-center mt-20">
        ⚠️ Vui lòng đăng nhập để truy cập trang quản trị
      </div>
    );

  if (user.role !== "admin")
    return (
      <div className="text-red-500 font-bold text-center mt-20">
        🚫 Bạn không có quyền truy cập trang quản trị
      </div>
    );

  // Chiều cao header và top bar
  const headerHeight = 80; // px, khớp với header chính
  const topBarHeight = 72; // px
  const gap = 32; // px khoảng cách từ header xuống top bar

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar nằm dưới header */}
      <div
        className="bg-gray-100 shadow-md flex flex-col sm:flex-row sm:items-center justify-between p-4 fixed left-0 w-full z-40"
        style={{ top: `${headerHeight + gap}px`, height: `${topBarHeight}px` }}
      >
        {/* Thông tin người dùng */}
        <div className="mb-2 sm:mb-0">
          <p className="font-bold">Tên người dùng: {user.username}</p>
          <p className="text-sm text-gray-700">Email: {user.email || "Chưa có email"}</p>
        </div>

        {/* Các nút chức năng */}
        <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
          <button
            className={`p-2 rounded transition-colors ${
              activeTab === "info" ? "bg-blue-600 text-white" : "hover:bg-blue-200"
            }`}
            onClick={() => setActiveTab("info")}
          >
            Thông tin người dùng
          </button>
          <button
            className={`p-2 rounded transition-colors ${
              activeTab === "address" ? "bg-blue-600 text-white" : "hover:bg-blue-200"
            }`}
            onClick={() => setActiveTab("address")}
          >
            Quản lý địa chỉ
          </button>
          <button
            className={`p-2 rounded transition-colors ${
              activeTab === "userManager" ? "bg-blue-600 text-white" : "hover:bg-blue-200"
            }`}
            onClick={() => setActiveTab("userManager")}
          >
            Quản lý tài khoản người dùng
          </button>
        </div>
      </div>

      {/* Nội dung chính với padding-top để tránh che Top Bar */}
      <div
        className="p-6"
        style={{ paddingTop: `${headerHeight + topBarHeight + gap + 16}px` }}
      >
        {activeTab === "info" && <AdminInfo />}
        {activeTab === "address" && <AdminAddressManager />}
        {activeTab === "userManager" && <UserManager />}
      </div>
    </div>
  );
}
