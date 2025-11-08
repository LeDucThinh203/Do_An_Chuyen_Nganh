// src/App.jsx
import React, { lazy, Suspense, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Session from "./Session/session";

// Product
import ProductList from "./view/Product/ProductList";
import AddProduct from "./view/Product/AddProduct";
import EditProduct from "./view/Product/EditProduct";

// Category
import CategoryList from "./view/Categories/CategoryList";
import CategoryForm from "./view/Categories/CategoryForm";

// Auth
import Login from "./view/Account/Login";
import Register from "./view/Account/Register";

// Admin Dashboard
import AdminDashboard from "./view/Admin/AdminDashboard";

// User Dashboard
import UserDashboard from "./view/User/UserDashboard";

// Lazy load Cart & Checkout
const Cart = lazy(() => import("./view/Cart/Cart"));
const Checkout = lazy(() => import("./view/Cart/Checkout"));

// Thêm lazy load cho trang xác nhận đơn hàng
const Confirmation = lazy(() => import("./view/Cart/Confirmation"));

export default function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(JSON.parse(localStorage.getItem("user")));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = () => {
    Session.logout();
    setUser(null);
  };

  const AdminRoute = ({ children }) => {
    if (!Session.isAdmin()) return <Login setUser={setUser} />;
    return children;
  };

  const UserRoute = ({ children }) => {
    if (!Session.isLoggedIn() || Session.isAdmin()) return <Login setUser={setUser} />;
    return children;
  };

  return (
    <Router>
      <div className="bg-gray-50 min-h-screen font-sans">
        {/* Navbar */}
        <nav className="bg-white shadow-sm fixed top-0 w-full z-50">
          <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
            <Link to="/" className="text-2xl font-extrabold text-blue-700 tracking-wide">
              CoolShop
            </Link>
            <div className="flex space-x-6 text-gray-700 font-medium">
              {user ? (
                <>
                  <Link to="/" className="hover:text-blue-500 transition">Trang chủ</Link>

                  {user.role === "admin" && (
                    <>
                      <Link to="/admin" className="hover:text-purple-500 transition">🛠 Admin Dashboard</Link>
                      <Link to="/categories" className="hover:text-purple-500 transition">📂 Danh mục</Link>
                      <Link to="/add" className="hover:text-green-500 transition">➕ Thêm sản phẩm</Link>
                    </>
                  )}

                  {user.role === "user" && (
                    <Link to="/user" className="hover:text-purple-500 transition">👤 User Dashboard</Link>
                  )}

                  <Link to="/cart" className="hover:text-yellow-500 transition">🛒 Giỏ hàng</Link>
                  <button onClick={handleLogout} className="hover:text-red-500 transition font-medium">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="hover:text-blue-500 transition">Login</Link>
                  <Link to="/register" className="hover:text-green-500 transition">Register</Link>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Main content */}
        <div className="pt-24 px-8 max-w-7xl mx-auto">
          <Suspense fallback={<p className="text-center mt-10">Đang tải...</p>}>
            <Routes>
              {/* Product routes */}
              <Route path="/" element={<ProductList />} />
              <Route path="/add" element={<AdminRoute><AddProduct /></AdminRoute>} />
              <Route path="/edit/:id" element={<AdminRoute><EditProduct /></AdminRoute>} />

              {/* Cart & Checkout */}
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              {/* Thêm route cho trang xác nhận đơn hàng */}
              <Route path="/order-confirmation" element={<Confirmation />} />

              {/* Admin Dashboard */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

              {/* User Dashboard */}
              <Route path="/user" element={<UserRoute><UserDashboard /></UserRoute>} />

              {/* Category routes */}
              <Route path="/categories" element={<AdminRoute><CategoryList /></AdminRoute>} />
              <Route path="/categories/add" element={<AdminRoute><CategoryForm /></AdminRoute>} />
              <Route path="/categories/edit/:id" element={<AdminRoute><CategoryForm /></AdminRoute>} />

              {/* Auth routes */}
              <Route path="/login" element={<Login setUser={setUser} />} />
              <Route path="/register" element={<Register />} />

              {/* 404 fallback */}
              <Route path="*" element={<p className="text-center mt-10">404 - Page not found</p>} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </Router>
  );
}
