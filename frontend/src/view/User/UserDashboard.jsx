// src/view/User/UserDashboard.js
import React, { useState, useMemo } from "react";
import Session from "../../Session/session";
import UserInfo from "./UserInfo";
import ChangePassword from "./ChangePassword";
import ManageAddress from "./ManageAddress";
import Address from "./Address";
import OrderManager from "./OrderManager"; // Sửa từ './OrderManager' thành './OrderManager'

export default function UserDashboard() {
  const user = useMemo(() => (Session.isLoggedIn() ? Session.getUser() : null), []);
  const [activeTab, setActiveTab] = useState("info"); // info | password | manageAddress | addressList | orders

  if (!user)
    return (
      <div className="text-red-500 font-bold text-center mt-20">
        ⚠️ Vui lòng đăng nhập để truy cập dashboard
      </div>
    );

  // Chiều cao header & top bar
  const headerHeight = 80; // px, khớp với header site
  const topBarHeight = 72; // px
  const gap = 32; // px khoảng cách từ header xuống top bar

  const renderContent = () => {
    switch (activeTab) {
      case "info":
        return <UserInfo />;
      case "password":
        return <ChangePassword />;
      case "manageAddress":
        return <ManageAddress />;
      case "addressList":
        return <Address />;
      case "orders":
        return <OrderManager />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div
        className="bg-gray-100 shadow-md flex flex-col sm:flex-row sm:items-center justify-between p-4 fixed left-0 w-full z-40"
        style={{ top: `${headerHeight + gap}px`, height: `${topBarHeight}px` }}
      >
        {/* Thông tin người dùng */}
        <div className="mb-2 sm:mb-0 text-center sm:text-left">
          <p className="font-bold">Tên người dùng: {user.username}</p>
          <p className="text-sm text-gray-700">Email: {user.email || "Chưa có email"}</p>
        </div>

        {/* Nút tab */}
        <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 justify-center">
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
              activeTab === "password" ? "bg-blue-600 text-white" : "hover:bg-blue-200"
            }`}
            onClick={() => setActiveTab("password")}
          >
            Đổi mật khẩu
          </button>
          <button
            className={`p-2 rounded transition-colors ${
              activeTab === "manageAddress" ? "bg-blue-600 text-white" : "hover:bg-blue-200"
            }`}
            onClick={() => setActiveTab("manageAddress")}
          >
            Cập nhật địa chỉ
          </button>
          <button
            className={`p-2 rounded transition-colors ${
              activeTab === "addressList" ? "bg-blue-600 text-white" : "hover:bg-blue-200"
            }`}
            onClick={() => setActiveTab("addressList")}
          >
            Danh sách địa chỉ
          </button>
          <button
            className={`p-2 rounded transition-colors ${
              activeTab === "orders" ? "bg-blue-600 text-white" : "hover:bg-blue-200"
            }`}
            onClick={() => setActiveTab("orders")}
          >
            Đơn hàng của tôi
          </button>
        </div>
      </div>

      {/* Nội dung chính */}
      <div
        className="p-6 max-w-6xl mx-auto"
        style={{ paddingTop: `${headerHeight + topBarHeight + gap + 16}px` }}
      >
        {renderContent()}
      </div>
    </div>
  );
}