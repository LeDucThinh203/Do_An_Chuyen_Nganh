import React, { lazy, Suspense, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Session from "./Session/session";
import { getCurrentUser, logout as logoutApi } from "./api";

// Components
import Header from "./view/Header/Header";
import { RouteFallbackSkeleton } from "./view/common/Skeletons";
import { ThemeProvider } from "./context/ThemeContext";
import { CartProvider } from "./context/CartContext";
import ThemeBackground from "./view/common/ThemeBackground";

// Split route screens so the initial storefront bundle does not include admin,
// checkout, account, and product-management code.
const ProductList = lazy(() => import("./view/Product/ProductList"));
const AddProduct = lazy(() => import("./view/Product/AddProduct"));
const EditProduct = lazy(() => import("./view/Product/EditProduct"));
const ProductDetail = lazy(() => import("./view/Product/ProductDetail"));
const ProductLoadMore = lazy(() => import("./view/Product/ProductLoadMore"));
const CategoryManager = lazy(() => import("./view/Admin/categories/CategoryManager"));
const CategoryForm = lazy(() => import("./view/Admin/categories/CategoryForm"));
const Login = lazy(() => import("./view/Account/Login"));
const Register = lazy(() => import("./view/Account/Register"));
const ForgotPassword = lazy(() => import("./view/Account/ForgotPassword"));
const ResetPassword = lazy(() => import("./view/Account/ResetPassword"));
const ProductManager = lazy(() => import("./view/Admin/ProductManager"));
const AdminDashboard = lazy(() => import("./view/Admin/AdminDashboard"));
const UserDashboard = lazy(() => import("./view/User/UserDashboard"));
const OrderSuccess = lazy(() => import("./view/Cart/OrderSuccess"));
const VNPayReturn = lazy(() => import("./view/Cart/VNPayReturn"));
const VNPayDebug = lazy(() => import("./view/Cart/VNPayDebug"));
const Footer = lazy(() => import("./view/Footer/Footer"));
const ChatWidget = lazy(() => import("./view/Chat/ChatWidget"));
const SupportChatWidget = lazy(() => import("./view/Chat/SupportChatWidget"));
const AdminSupportChatWidget = lazy(() => import("./view/Admin/AdminSupportChatWidget"));

// Lazy load Cart & Checkout
const Cart = lazy(() => import("./view/Cart/Cart"));
const Checkout = lazy(() => import("./view/Cart/Checkout"));
const Confirmation = lazy(() => import("./view/Cart/Confirmation"));

// ScrollToTop Component
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, hash]);
  return null;
}

function AppContent() {
  const { pathname } = useLocation();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [chatMode, setChatMode] = useState(() => (
    window.localStorage.getItem("chat_mode") === "ai" ? "ai" : "support"
  ));
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const initialAuthVersion = Session.getVersion();
    const handleAuthChange = () => setUser(Session.getUserOrNull());
    window.addEventListener(Session.AUTH_CHANGED_EVENT, handleAuthChange);

    getCurrentUser()
      .then((profile) => {
        if (!active || Session.getVersion() !== initialAuthVersion) return;
        if (profile) Session.setUser(profile);
        else Session.clearUser();
      })
      .catch(() => {
        if (active && Session.getVersion() === initialAuthVersion) Session.clearUser();
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });

    return () => {
      active = false;
      window.removeEventListener(Session.AUTH_CHANGED_EVENT, handleAuthChange);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("chat_mode", chatMode);
  }, [chatMode]);

  const handleChatModeChange = (mode) => {
    if (mode !== "ai" && mode !== "support") return;
    setChatMode(mode);
    // Choosing a chat channel should open it. Keep this state above both
    // widgets so changing channels cannot reset the window to its closed state.
    setChatOpen(true);
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Đăng xuất phía máy chủ thất bại:", error);
    } finally {
      Session.clearUser();
      setUser(null);
    }
  };

  const AdminRoute = ({ children }) => {
    if (!authReady) return <RouteFallbackSkeleton />;
    if (!Session.isLoggedIn()) {
      return <Navigate to="/login" replace state={{ message: "Đăng nhập bằng tài khoản quản trị để tiếp tục.", returnTo: pathname }} />;
    }
    if (!Session.isAdmin()) return <Navigate to="/" replace />;
    return children;
  };

  const UserRoute = ({ children }) => {
    if (!authReady) return <RouteFallbackSkeleton />;
    if (!Session.isLoggedIn()) {
      return <Navigate to="/login" replace state={{ message: "Đăng nhập để xem hồ sơ và đơn hàng.", returnTo: "/user" }} />;
    }
    if (Session.isAdmin()) return <Navigate to="/admin" replace />;
    return children;
  };

  const CheckoutRoute = ({ children }) => {
    if (!authReady) return <RouteFallbackSkeleton />;
    if (!Session.isLoggedIn()) {
      return <Navigate to="/login" replace state={{ message: "Đăng nhập để tiếp tục thanh toán.", returnTo: "/checkout" }} />;
    }
    return children;
  };

  const ConfirmationRoute = ({ children }) => {
    if (!authReady) return <RouteFallbackSkeleton />;
    if (!Session.isLoggedIn()) {
      return <Navigate to="/login" replace state={{ message: "Đăng nhập để xem xác nhận đơn hàng.", returnTo: "/order-confirmation" }} />;
    }
    return children;
  };

  // Kiểm tra route để không render header/footer trên trang chủ (đã có header riêng) và các trang quản trị Admin
  const isAdminPage =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/categories") ||
    pathname === "/add" ||
    pathname.startsWith("/add/") ||
    pathname.startsWith("/edit");

  const showHeader = pathname !== "/" && !pathname.startsWith("/category/") && !isAdminPage;
  const isAdminUser = Session.isAdmin();

  return (
    <div className="relative flex min-h-screen w-full min-w-0 flex-col font-sans transition-colors duration-500">
      {/* Quiet background keeps attention on products and controls. */}
      <ThemeBackground />

      {/* Navbar */}
      {showHeader && <Header user={user} handleLogout={handleLogout} />}

      {/* Main content */}
      <div className={`relative z-10 min-w-0 w-full flex-grow ${showHeader ? "pt-32" : "p-0"}`}>
        <Suspense fallback={<RouteFallbackSkeleton />}>
          <Routes>
            {/* Public */}
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/product/:id/" element={<ProductDetail />} />
            <Route path="/category/:categoryId" element={<ProductLoadMore />} />
            <Route path="/category/:categoryId/" element={<ProductLoadMore />} />
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

            {/* Home route đặt gần cuối để tránh bắt nhầm khi URL là route cụ thể */}
            <Route path="/" element={<ProductList />} />

            {/* 404 */}
            <Route path="*" element={<p className="text-center mt-10">404 - Page not found</p>} />
          </Routes>
        </Suspense>
      </div>

      {/* Footer */}
      {!isAdminPage && !pathname.startsWith("/user") && (
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      )}

      {!isAdminPage && authReady && !isAdminUser && (
        <Suspense fallback={null}>
          <ChatWidget
            active={chatMode === "ai"}
            isOpen={chatOpen}
            onOpenChange={setChatOpen}
            onModeChange={handleChatModeChange}
          />
          <SupportChatWidget
            active={chatMode === "support"}
            isOpen={chatOpen}
            onOpenChange={setChatOpen}
            onModeChange={handleChatModeChange}
          />
        </Suspense>
      )}

      {isAdminUser && pathname !== "/admin" && pathname !== "/" && !pathname.startsWith("/category/") && (
        <Suspense fallback={null}>
          <AdminSupportChatWidget />
        </Suspense>
      )}

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <CartProvider>
          <ScrollToTop />
          <AppContent />
        </CartProvider>
      </Router>
    </ThemeProvider>
  );
}
