import React, { lazy, Suspense, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Session from "./Session/session";

// Components
import Footer from "./view/Footer/Footer";
import Header from "./view/Header/Header";
import ChatWidget from "./view/Chat/ChatWidget";
import SupportChatWidget from "./view/Chat/SupportChatWidget";
import AdminSupportChatWidget from "./view/Admin/AdminSupportChatWidget";

// Product
import ProductList from "./view/Product/ProductList";
import AddProduct from "./view/Product/AddProduct";
import EditProduct from "./view/Product/EditProduct";
import ProductDetail from "./view/Product/ProductDetail";
import ProductLoadMore from "./view/Product/ProductLoadMore";

// Category
import CategoryManager from "./view/Admin/categories/CategoryManager";
import CategoryForm from "./view/Admin/categories/CategoryForm";

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
import { RouteFallbackSkeleton } from "./view/common/Skeletons";

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
  const [chatMode, setChatMode] = useState(() => localStorage.getItem("chat_mode") || "support");

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(JSON.parse(localStorage.getItem("user")));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    localStorage.setItem("chat_mode", chatMode);
  }, [chatMode]);

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

  // Kiểm tra route để không render header trên ProductList và ProductLoadMore
  const showHeader = pathname !== "/" && !pathname.startsWith("/category/");
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminUser = user?.role === "admin";

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
      {/* Navbar */}
      {showHeader && <Header user={user} handleLogout={handleLogout} />}

      {/* Main content */}
      <div className="pt-24 px-4 sm:px-6 lg:px-8 flex-grow w-full">
        <Suspense fallback={<RouteFallbackSkeleton />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<ProductList />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/category/:categoryId" element={<ProductLoadMore />} />
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
                  <CategoryManager />
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

      {!isAdminPage && (
        <>
          {/* Chat mode toggle */}
          <div className="fixed right-4 bottom-20 z-[1250] bg-white border border-slate-200 rounded-xl shadow-lg p-1 flex gap-1">
            <button
              onClick={() => setChatMode("ai")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${chatMode === "ai" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}
            >
              AI Chat
            </button>
            <button
              onClick={() => setChatMode("support")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${chatMode === "support" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}
            >
              CSKH
            </button>
          </div>

          {/* Keep both widgets available; user selects mode via toggle */}
          {chatMode === "ai" ? <ChatWidget /> : <SupportChatWidget />}
        </>
      )}

      {isAdminPage && isAdminUser && <AdminSupportChatWidget />}
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