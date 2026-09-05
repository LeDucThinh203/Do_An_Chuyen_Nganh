// src/view/Cart/OrderSuccess.jsx
import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Session from "../../Session/session";

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, orderData } = location.state || {};

  const handleViewOrders = () => {
    const userRole = Session.getRole();
    if (userRole === "admin") {
      navigate("/admin", { state: { activeTab: "orderManager" } });
    } else {
      navigate("/user", { state: { activeTab: "orders" } });
    }
  };

  if (!orderId) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-10 text-center max-w-md w-full border border-slate-200/80 shadow-xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-3xl">
            📦
          </div>
          <h2 className="text-xl font-bold text-slate-900">Không tìm thấy đơn hàng</h2>
          <p className="text-sm text-slate-500">
            Thông tin đơn hàng không tồn tại hoặc phiên giao dịch đã hết hạn.
          </p>
          <Link
            to="/"
            className="inline-block py-3 px-6 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition"
          >
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-2xl text-center space-y-8 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 -mt-16 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Celebration icon */}
        <div className="relative">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 shadow-xl shadow-emerald-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center text-emerald-500 text-4xl">
              ✓
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Đặt Hàng Thành Công
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Cảm Ơn Bạn Đã Mua Sắm!
          </h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Đơn hàng trang phục thể thao của bạn đã được tiếp nhận và nhân viên sẽ nhanh chóng đóng gói vận chuyển.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-3 text-xs sm:text-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
            <span className="text-slate-500">Mã đơn hàng:</span>
            <span className="font-mono font-black text-slate-900 text-base">#{orderId}</span>
          </div>

          {orderData && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Người nhận:</span>
                <span className="font-bold text-slate-900">{orderData.name} ({orderData.phone})</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-500 flex-shrink-0">Giao đến:</span>
                <span className="font-medium text-slate-700 text-right truncate max-w-xs">{orderData.address}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Hình thức thanh toán:</span>
                <span className="font-semibold text-slate-800">
                  {orderData.payment_method === "vnpay" ? "Cổng VNPay" : "Thanh toán khi nhận hàng (COD)"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-200/60">
                <span className="font-bold text-slate-700">Tổng thanh toán:</span>
                <span className="font-black text-blue-600 text-xl">
                  {Number(orderData.total_amount).toLocaleString("vi-VN")} ₫
                </span>
              </div>
            </>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/60 text-xs text-blue-800 leading-relaxed">
          ⚡ Thông tin chi tiết đơn hàng đã được cập nhật vào tài khoản cá nhân. Đơn hàng sẽ được nhân viên chăm sóc khách hàng gọi điện xác nhận trong ít phút.
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to="/"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition text-center"
          >
            ← Tiếp tục mua sắm
          </Link>
          <button
            onClick={handleViewOrders}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-blue-600/30 transition text-center hover:scale-105"
          >
            Theo dõi đơn hàng của tôi →
          </button>
        </div>
      </div>
    </div>
  );
}