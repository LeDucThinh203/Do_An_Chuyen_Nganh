import React, { useState, useMemo } from "react";
import Session from "../../Session/session";
import AdminInfo from "./AdminInfo";
import AdminAddressManager from "./AdminAddressManager";
import UserManager from "./UserManager";
import ProductManager from "./ProductManager";
import CategoryManager from "./categories/CategoryManager";
import OrderManager from "./OrderManager";
import Revenue from "./Revenue"; // Thêm import Revenue
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const user = useMemo(() => (Session.isLoggedIn() ? Session.getUser() : null), []);
  const [activeTab, setActiveTab] = useState("info");
  const navigate = useNavigate();

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

  const headerHeight = 80;
  const topBarHeight = 72;
  const gap = 32;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div
        className="bg-gray-100 shadow-md flex flex-col sm:flex-row sm:items-center justify-between p-4 fixed left-0 w-full z-40"
        style={{ top: `${headerHeight + gap}px`, height: `${topBarHeight}px` }}
      >
        <div className="mb-2 sm:mb-0">
          <p className="font-bold">Tên người dùng: {user.username}</p>
          <p className="text-sm text-gray-700">{user.email || "Chưa có email"}</p>
        </div>

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
            Quản lý tài khoản
          </button>
          <button
            className={`p-2 rounded transition-colors ${
              activeTab === "product" ? "bg-blue-600 text-white" : "hover:bg-blue-200"
            }`}
            onClick={() => setActiveTab("product")}
          >
            Quản lý sản phẩm
          </button>
          <button
            className={`p-2 rounded transition-colors ${
              activeTab === "category" ? "bg-blue-600 text-white" : "hover:bg-blue-200"
            }`}
            onClick={() => setActiveTab("category")}
          >
            Quản lý danh mục
          </button>
          <button
            className={`p-2 rounded transition-colors ${
              activeTab === "orderManager" ? "bg-blue-600 text-white" : "hover:bg-blue-200"
            }`}
            onClick={() => setActiveTab("orderManager")}
          >
            Quản lý đơn hàng
          </button>
          {/* Thêm nút Doanh thu */}
          <button
            className={`p-2 rounded transition-colors ${
              activeTab === "revenue" ? "bg-green-600 text-white" : "hover:bg-green-200"
            }`}
            onClick={() => setActiveTab("revenue")}
          >
            📊 Doanh thu
          </button>
        </div>
      </div>

      {/* Nội dung chính */}
      <div
        className="p-6"
        style={{ paddingTop: `${headerHeight + topBarHeight + gap + 16}px` }}
      >
        {activeTab === "info" && <AdminInfo />}
        {activeTab === "address" && <AdminAddressManager />}
        {activeTab === "userManager" && <UserManager />}
        {activeTab === "product" && <ProductManager />}
        {activeTab === "category" && <CategoryManager />}
        {activeTab === "orderManager" && <OrderManager />}
        {activeTab === "revenue" && <Revenue />} {/* Thêm Revenue component */}
      </div>
    </div>
  );
}