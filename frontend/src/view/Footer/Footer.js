import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Footer() {
  const { pathname } = useLocation();
  const isDashboardPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/user") ||
    pathname.startsWith("/categories") ||
    pathname === "/add" ||
    pathname.startsWith("/add/") ||
    pathname.startsWith("/edit");
  const isAuthPath = ["/login", "/register", "/forgot-password"].includes(pathname) || pathname.startsWith("/reset-password/");

  if (isDashboardPath || isAuthPath) return null;

  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <div>
          <span className="site-footer__eyebrow">COOLSHOP</span>
          <h2>Tìm món đồ phù hợp với nhịp vận động của bạn.</h2>
          <p>Duyệt danh mục, xem size còn hàng và chọn phương thức thanh toán ngay tại bước đặt hàng.</p>
        </div>
        <div className="site-footer__actions">
          <Link to="/" className="site-footer__primary">Khám phá sản phẩm <span aria-hidden="true">→</span></Link>
          <Link to="/cart" className="site-footer__secondary">Mở giỏ hàng</Link>
        </div>
      </div>

      <div className="site-footer__links">
        <div>
          <h3>Cửa hàng</h3>
          <Link to="/">Trang chủ</Link>
          <Link to="/#product-sections">Tất cả sản phẩm</Link>
          <Link to="/cart">Giỏ hàng</Link>
        </div>
        <div>
          <h3>Tài khoản</h3>
          <Link to="/login">Đăng nhập</Link>
          <Link to="/register">Tạo tài khoản</Link>
          <Link to="/user">Đơn hàng và hồ sơ</Link>
        </div>
        <div>
          <h3>Thanh toán</h3>
          <p>Chọn thanh toán khi nhận hàng (COD) hoặc VNPay tại bước đặt hàng.</p>
        </div>
        <div>
          <h3>Hỗ trợ</h3>
          <p>Dùng khung chat hỗ trợ ở góc màn hình để gửi câu hỏi cho cửa hàng.</p>
          <Link to="/forgot-password">Khôi phục mật khẩu</Link>
        </div>
      </div>

      <div className="site-footer__bottom">
        <Link to="/" className="site-footer__wordmark">COOLSHOP</Link>
        <span>© {new Date().getFullYear()} CoolShop</span>
      </div>
    </footer>
  );
}
