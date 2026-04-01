import React, { useState, useMemo, useEffect } from "react";
import Session from "../../Session/session";
import AdminInfo from "./AdminInfo";
import AdminAddressManager from "./AdminAddressManager";
import UserManager from "./UserManager";
import ProductManager from "./ProductManager";
import CategoryManager from "./categories/CategoryManager";
import OrderManager from "./OrderManager";
import Revenue from "./Revenue";
import { useNavigate, useLocation } from "react-router-dom";

export default function AdminDashboard() {
  const user = useMemo(() => (Session.isLoggedIn() ? Session.getUser() : null), []);
  const [activeTab, setActiveTab] = useState("info");
  const [menuOpen, setMenuOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Xử lý activeTab từ state khi navigate về
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

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

  const menuItems = [
    { id: "info", label: "Thông tin tài khoản quản trị" },
    { id: "revenue", label: "Doanh thu" },
    { id: "product", label: "Quản lý sản phẩm" },
    { id: "orderManager", label: "Quản lý đơn hàng" },
    { id: "userManager", label: "Quản lý người dùng" },
    { id: "address", label: "Quản lý địa chỉ" },
    { id: "category", label: "Quản lý danh mục" }
    ];

  const getPageTitle = () => {
    const titles = {
      info: "Bảng Điều Khiển Quản Trị",
      product: "Quản lý sản phẩm",
      category: "Quản lý danh mục",
      orderManager: "Quản lý đơn hàng",
      userManager: "Quản lý người dùng",
      address: "Quản lý địa chỉ",
      revenue: "Bảng giá & Doanh thu"
    };
    return titles[activeTab] || "Bảng Điều Khiển";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: 0 }}>
      {/* Sidebar Menu - Gắn cứng sát trái tuyệt đối */}
      <div 
        className={`bg-white shadow-lg transition-all duration-300 flex-shrink-0 ${
          menuOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}
        style={{ position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 1000, margin: 0, padding: 0 }}
      >
        <div className="h-full flex flex-col">
          {/* Menu Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <h2 className="text-lg font-bold text-gray-800">Menu</h2>
            <button 
              onClick={() => setMenuOpen(false)}
              className="text-gray-500 hover:text-gray-700 transition p-1 rounded hover:bg-gray-100"
              title="Thu gọn menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path>
              </svg>
            </button>
          </div>

          {/* Menu Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {/* Bảng quản lý dropdown - Có thể click */}
            <div className="mb-2">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full bg-blue-500 text-white px-4 py-2.5 rounded-lg flex items-center justify-between cursor-pointer hover:bg-blue-600 transition"
              >
                <span className="font-medium">Bảng quản lý</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
            </div>

            {/* Menu Items - Hiển thị khi dropdown mở */}
            {dropdownOpen && (
              <div className="space-y-1 pl-0">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
                      activeTab === item.id 
                        ? "bg-blue-50 text-blue-600 font-medium" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area - Margin left để tránh sidebar */}
      <div 
        className="flex-1 flex flex-col overflow-hidden"
        style={{ marginLeft: menuOpen && !isMobile ? '256px' : '0', transition: 'margin-left 0.3s' }}
      >
        {/* Top Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              {!menuOpen && (
                <button 
                  onClick={() => setMenuOpen(true)}
                  className="text-gray-600 hover:text-gray-800 transition p-2 rounded hover:bg-gray-100"
                  title="Mở menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
                  </svg>
                </button>
              )}
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800 truncate max-w-[60vw] sm:max-w-none">
                {getPageTitle()}
              </h1>
            </div>
            
            <div className="hidden sm:flex items-center space-x-4">
              <div className="text-right">
                <p className="font-semibold text-gray-800">{user.username}</p>
                <p className="text-sm text-gray-500">{user.email || "Admin"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-auto bg-gray-50 p-3 sm:p-6">
          {activeTab === "info" && <AdminInfo />}
          {activeTab === "address" && <AdminAddressManager />}
          {activeTab === "userManager" && <UserManager />}
          {activeTab === "product" && <ProductManager />}
          {activeTab === "category" && <CategoryManager />}
          {activeTab === "orderManager" && <OrderManager />}
          {activeTab === "revenue" && <Revenue />}
        </div>
      </div>
    </div>
  );
}