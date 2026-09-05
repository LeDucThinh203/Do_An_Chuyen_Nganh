// src/view/Cart/VNPayReturn.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { updateOrderPaymentStatus } from "../../api";
import Session from "../../Session/session";

export default function VNPayReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentResult, setPaymentResult] = useState(null);
  const [error, setError] = useState("");

  const handleViewOrders = () => {
    const userRole = Session.getRole();
    if (userRole === "admin") {
      navigate("/admin", { state: { activeTab: "orderManager" } });
    } else {
      navigate("/user", { state: { activeTab: "orders" } });
    }
  };

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Lấy tất cả query params
        const params = {};
        for (let [key, value] of searchParams.entries()) {
          params[key] = value;
        }

        console.log("VNPay callback params:", params);

        // Kiểm tra response code trực tiếp
        const responseCode = params.vnp_ResponseCode;
        
        if (!responseCode) {
          setError("Không tìm thấy thông tin thanh toán");
          setLoading(false);
          return;
        }

        // Tạo result object từ params
        const result = {
          success: responseCode === '00',
          code: responseCode,
          message: responseCode === '00' ? 'Giao dịch thành công' : 'Giao dịch thất bại',
          data: {
            orderId: params.vnp_TxnRef,
            amount: params.vnp_Amount ? parseInt(params.vnp_Amount) / 100 : 0,
            orderInfo: params.vnp_OrderInfo,
            responseCode: params.vnp_ResponseCode,
            transactionNo: params.vnp_TransactionNo,
            bankCode: params.vnp_BankCode,
            payDate: params.vnp_PayDate
          }
        };
        
        console.log("Payment result:", result);
        setPaymentResult(result);

        // Nếu thanh toán thành công, cập nhật đơn hàng
        if (result.success && result.code === '00') {
          try {
            const orderId = result.data.orderId;
            
            // Cập nhật trạng thái thanh toán đơn hàng
            const paymentInfo = JSON.stringify({
              transactionNo: result.data.transactionNo,
              bankCode: result.data.bankCode,
              payDate: result.data.payDate,
              amount: result.data.amount,
              responseCode: result.data.responseCode
            });
            
            await updateOrderPaymentStatus(orderId, true, paymentInfo);
            
            console.log(`✅ Order #${orderId} payment status updated successfully`);
            
            // Xóa localStorage sau khi thanh toán thành công
            localStorage.removeItem("last_order");
            localStorage.removeItem("cart");
            localStorage.removeItem("checkout_items");
            localStorage.removeItem("checkout_form");
            localStorage.removeItem("pending_order_id");
            
          } catch (updateError) {
            console.error("❌ Error updating order payment status:", updateError);
            // Không throw error, vẫn hiển thị success cho user
          }
        }

      } catch (err) {
        console.error("Error processing VNPay payment:", err);
        setError(err.message || "Lỗi xử lý thanh toán");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  const getResponseMessage = (code) => {
    const messages = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
      '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)'
    };
    return messages[code] || 'Lỗi không xác định';
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-10 text-center max-w-md w-full border border-slate-200/80 shadow-xl space-y-4">
          <div className="w-12 h-12 mx-auto border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          <h2 className="text-lg font-bold text-slate-900">Đang xác thực giao dịch...</h2>
          <p className="text-xs text-slate-500">Vui lòng chờ trong giây lát, không tắt trình duyệt.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-10 text-center max-w-md w-full border border-slate-200/80 shadow-xl space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center text-3xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-slate-900">Lỗi xác thực giao dịch</h2>
          <p className="text-xs text-slate-500">{error}</p>
          <Link
            to="/"
            className="inline-block py-3 px-6 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md hover:bg-slate-800 transition"
          >
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  if (!paymentResult) {
    return null;
  }

  const isSuccess = paymentResult.success && paymentResult.code === "00";

  return (
    <div className="min-h-screen bg-slate-50/60 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-2xl text-center space-y-6 relative overflow-hidden">
        {/* Glow */}
        <div
          className={`absolute top-0 right-1/2 translate-x-1/2 -mt-16 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
            isSuccess ? "bg-emerald-500/15" : "bg-rose-500/15"
          }`}
        ></div>

        {/* Icon */}
        <div>
          <div
            className={`w-20 h-20 mx-auto rounded-3xl p-1 shadow-xl flex items-center justify-center ${
              isSuccess
                ? "bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-emerald-500/25"
                : "bg-gradient-to-tr from-rose-500 to-amber-500 shadow-rose-500/25"
            }`}
          >
            <div className="w-full h-full bg-white rounded-[20px] flex items-center justify-center text-3xl">
              {isSuccess ? "✓" : "✕"}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <span
            className={`inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
              isSuccess
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {isSuccess ? "Giao dịch hoàn tất" : "Thanh toán không thành công"}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isSuccess ? "Thanh Toán Thành Công!" : "Giao Dịch Bị Gián Đoạn"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {isSuccess
              ? "Đơn hàng đã được thanh toán qua cổng VNPay và ghi nhận vào hệ thống."
              : "Thanh toán chưa hoàn tất. Bạn có thể thử lại hoặc chọn hình thức trả tiền mặt COD."}
          </p>
        </div>

        {/* Details card */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Mã đơn hàng:</span>
            <span className="font-mono font-bold text-slate-900">#{paymentResult.data?.orderId || "N/A"}</span>
          </div>

          {paymentResult.data?.amount && (
            <div className="flex justify-between">
              <span className="text-slate-500">Số tiền:</span>
              <span className="font-black text-blue-600 text-sm">
                {Number(paymentResult.data.amount).toLocaleString("vi-VN")} ₫
              </span>
            </div>
          )}

          {paymentResult.data?.transactionNo && (
            <div className="flex justify-between">
              <span className="text-slate-500">Mã giao dịch VNPay:</span>
              <span className="font-mono font-medium text-slate-700">{paymentResult.data.transactionNo}</span>
            </div>
          )}

          {paymentResult.data?.bankCode && (
            <div className="flex justify-between">
              <span className="text-slate-500">Ngân hàng:</span>
              <span className="font-bold text-slate-900">{paymentResult.data.bankCode}</span>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-slate-200/60">
            <span className="text-slate-500">Phản hồi hệ thống:</span>
            <span className={`font-bold ${isSuccess ? "text-emerald-700" : "text-rose-600"}`}>
              {getResponseMessage(paymentResult.code)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            to="/"
            className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
          >
            ← Về trang chủ
          </Link>
          {isSuccess ? (
            <button
              onClick={handleViewOrders}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition hover:scale-105"
            >
              Xem đơn hàng của tôi →
            </button>
          ) : (
            <Link
              to="/cart"
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition font-medium"
            >
              Thử lại
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
