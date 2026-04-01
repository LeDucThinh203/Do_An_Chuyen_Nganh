import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Header() {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  // Hàm cập nhật số lượng sản phẩm trong giỏ hàng
  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    setCartCount(totalItems);
  };

  // Lấy user từ localStorage khi component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Cập nhật cart count lần đầu
    updateCartCount();
    
    // Lắng nghe sự kiện storage để cập nhật khi cart thay đổi từ tab khác
    const handleStorageChange = (e) => {
      if (e.key === 'cart') {
        updateCartCount();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Polling để cập nhật cart count định kỳ (cho trường hợp cùng tab)
    const interval = setInterval(updateCartCount, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setDropdownOpen(false);
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-sm fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-8 flex flex-col sm:flex-row items-center justify-between py-3 sm:py-4 gap-3 sm:gap-4">
        {/* Logo */}
        <Link to="/" className="text-xl sm:text-2xl font-extrabold text-blue-700 tracking-wide">
          CoolShop
        </Link>

        {/* Menu */}
        <div className="flex flex-wrap justify-center sm:justify-end gap-3 sm:space-x-4 text-gray-700 font-medium items-center relative flex-shrink-0 text-sm sm:text-base">
          <Link to="/cart" className="relative hover:text-yellow-500 transition">
            🛒 Giỏ hàng
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-1 hover:text-blue-500 transition font-medium"
              >
                <span>Xin chào, {user.username}</span>
                <svg
                  className={`w-4 h-4 transform transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-md py-2 z-50">
                  {user.role === "admin" && (
                    <>
                      <Link
                        to="/admin"
                        className="block px-4 py-2 hover:bg-gray-100 transition"
                        onClick={() => setDropdownOpen(false)}
                      >
                        🛠 Thông tin tài khoản quản trị viên
                      </Link>
                    </>
                  )}

                  {user.role === "user" && (
                    <Link
                      to="/user"
                      className="block px-4 py-2 hover:bg-gray-100 transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      👤 Thông tin tài khoản người dùng
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                  >
                    🚪 Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-500 transition">
                Login
              </Link>
              <Link to="/register" className="hover:text-green-500 transition">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
