import React, { lazy, Suspense, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Session from "./Session/session";

// Components
import Footer from "./view/Footer/Footer";
import Header from "./view/Header/Header";

// Product
import ProductList from "./view/Product/ProductList";
import AddProduct from "./view/Product/AddProduct";
import EditProduct from "./view/Product/EditProduct";
import ProductDetail from "./view/Product/ProductDetail";

// Category
import CategoryList from "./view/Categories/CategoryList";
import CategoryForm from "./view/Categories/CategoryForm";

// Auth
import Login from "./view/Account/Login";
import Register from "./view/Account/Register";
import ForgotPassword from "./view/Account/ForgotPassword";
import ResetPassword from "./view/Account/ResetPassword";

// Admin
import ProductManager from "./view/Admin/ProductManager";
import AdminDashboard from "./view/Admin/AdminDashboard";

// User
import UserDashboard from "./view/User/UserDashboard";

// Order Success
import OrderSuccess from "./view/Cart/OrderSuccess";
import VNPayReturn from "./view/Cart/VNPayReturn";
import VNPayDebug from "./view/Cart/VNPayDebug";

// Lazy load Cart & Checkout
const Cart = lazy(() => import("./view/Cart/Cart"));
const Checkout = lazy(() => import("./view/Cart/Checkout"));
const Confirmation = lazy(() => import("./view/Cart/Confirmation"));

// ScrollToTop Component
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const { pathname } = useLocation();
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

  const CheckoutRoute = ({ children }) => {
    if (!Session.isLoggedIn()) {
      window.alert("Bạn cần đăng nhập để thanh toán!");
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  const ConfirmationRoute = ({ children }) => {
    if (!Session.isLoggedIn()) {
      window.alert("Bạn cần đăng nhập để xác nhận đơn hàng!");
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // Kiểm tra route để không render header trên ProductList
  const showHeader = pathname !== "/";

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
      {/* Navbar */}
      {showHeader && <Header user={user} handleLogout={handleLogout} />}

      {/* Main content */}
      <div className="pt-24 px-8 max-w-7xl mx-auto flex-grow">
        <Suspense fallback={<p className="text-center mt-10">Đang tải...</p>}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<ProductList />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/cart" element={<Cart />} />
            <Route
              path="/checkout"
              element={
                <CheckoutRoute>
                  <Checkout />
                </CheckoutRoute>
              }
            />
            <Route
              path="/order-confirmation"
              element={
                <ConfirmationRoute>
                  <Confirmation />
                </ConfirmationRoute>
              }
            />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/vnpay-return" element={<VNPayReturn />} />
            <Route path="/vnpay-debug" element={<VNPayDebug />} />

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/product-manager"
              element={
                <AdminRoute>
                  <ProductManager />
                </AdminRoute>
              }
            />
            <Route
              path="/add"
              element={
                <AdminRoute>
                  <AddProduct />
                </AdminRoute>
              }
            />
            <Route
              path="/edit/:id"
              element={
                <AdminRoute>
                  <EditProduct />
                </AdminRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <AdminRoute>
                  <CategoryList />
                </AdminRoute>
              }
            />
            <Route
              path="/categories/add"
              element={
                <AdminRoute>
                  <CategoryForm />
                </AdminRoute>
              }
            />
            <Route
              path="/categories/edit/:id"
              element={
                <AdminRoute>
                  <CategoryForm />
                </AdminRoute>
              }
            />

            {/* User */}
            <Route
              path="/user"
              element={
                <UserRoute>
                  <UserDashboard />
                </UserRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<p className="text-center mt-10">404 - Page not found</p>} />
          </Routes>
        </Suspense>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}