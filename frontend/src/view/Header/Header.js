import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Header({ onSearch, products = [] }) {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const searchRef = useRef();
  const navigate = useNavigate();

  // Lấy user từ localStorage khi component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (onSearch) onSearch(value);

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    const filtered = products
      .filter((p) => p.name.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 5);
    setSuggestions(filtered);
  };

  const handleSelectSuggestion = (name) => {
    setSearchTerm(name);
    setSuggestions([]);
    if (onSearch) onSearch(name);
  };

  const handleLogout = () => {
    localStorage.removeItem("user"); // Xóa khỏi localStorage
    setUser(null); // Reset state
    setDropdownOpen(false);
    navigate("/login");
  };

  // Đóng suggestions khi click ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-white shadow-sm fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between py-4 gap-4">
        {/* Logo */}
        <Link to="/" className="text-2xl font-extrabold text-blue-700 tracking-wide">
          CoolShop
        </Link>

        {/* Search */}
        <div className="relative w-full sm:w-1/3" ref={searchRef}>
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {suggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded shadow-md mt-1 z-50 max-h-64 overflow-y-auto">
              {suggestions.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelectSuggestion(p.name)}
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                  <div className="flex-1 text-sm">
                    <p className="truncate">{p.name}</p>
                    <p className="text-red-600">{Number(p.price).toLocaleString()} ₫</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Menu */}
        <div className="flex space-x-4 text-gray-700 font-medium items-center relative flex-shrink-0">
          <Link to="/" className="hover:text-blue-500 transition">
            Trang chủ
          </Link>
          <Link to="/cart" className="hover:text-yellow-500 transition">
            🛒 Giỏ hàng
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-1 hover:text-blue-500 transition font-medium"
              >
                <span>Hi, {user.username}</span>
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
                        🛠 Admin Dashboard
                      </Link>
                      <Link
                        to="/categories"
                        className="block px-4 py-2 hover:bg-gray-100 transition"
                        onClick={() => setDropdownOpen(false)}
                      >
                        📂 Danh mục
                      </Link>
                      <Link
                        to="/add"
                        className="block px-4 py-2 hover:bg-gray-100 transition"
                        onClick={() => setDropdownOpen(false)}
                      >
                        ➕ Thêm sản phẩm
                      </Link>
                    </>
                  )}

                  {user.role === "user" && (
                    <Link
                      to="/user"
                      className="block px-4 py-2 hover:bg-gray-100 transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      👤 User Dashboard
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                  >
                    Logout
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
