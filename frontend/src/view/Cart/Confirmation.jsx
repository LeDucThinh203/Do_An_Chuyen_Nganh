// src/view/Cart/Confirmation.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createOrder, getAllProductSizes, getAllSizes, createVNPayPaymentUrl } from "../../api";

export default function Confirmation() {
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [productSizes, setProductSizes] = useState([]);
  const [sizes, setSizes] = useState([]);

  useEffect(() => {
    const storedOrder = JSON.parse(localStorage.getItem("last_order"));
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (!storedOrder) {
      navigate("/");
      return;
    }

    setOrderData(storedOrder);
    setUser(storedUser);
    loadProductSizesData();
  }, [navigate]);

  const loadProductSizesData = async () => {
    try {
      const [productSizesData, sizesData] = await Promise.all([
        getAllProductSizes(),
        getAllSizes(),
      ]);
      setProductSizes(productSizesData);
      setSizes(sizesData);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu sizes:", err);
    }
  };

  const findProductSizeId = (productId, sizeName) => {
    if (!productId || !sizeName) return null;

    const size = sizes.find((s) => s.size === sizeName);
    if (!size) return null;

    const productSize = productSizes.find(
      (ps) => ps.product_id === productId && ps.size_id === size.id
    );

    return productSize ? productSize.id : null;
  };

  if (!orderData) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Đang chuẩn bị xác nhận đơn hàng...</p>
        </div>
      </div>
    );
  }

  const handleConfirm = async () => {
    setLoading(true);
    setError("");

    try {
      const orderDetails = orderData.items.map((item) => {
        const productSizesId = findProductSizeId(item.id, item.size);

        if (!productSizesId) {
          throw new Error(`Không tìm thấy kích cỡ phù hợp cho sản phẩm "${item.name}" (Size: ${item.size})`);
        }

        return {
          product_sizes_id: productSizesId,
          quantity: item.quantity,
          price: item.price,
        };
      });

      if (orderDetails.length === 0) {
        throw new Error("Không có sản phẩm hợp lệ để hoàn tất đặt hàng");
      }

      const orderPayload = {
        name: orderData.name,
        phone: orderData.phone,
        address: orderData.address,
        account_id: user?.id || null,
        total_amount: orderData.total,
        payment_method: orderData.payment_method || "cod",
        is_paid: false,
        order_details: orderDetails,
      };

      const result = await createOrder(orderPayload);

      if (result && result.id) {
        if (orderData.payment_method === "vnpay") {
          try {
            const uniqueOrderId = `${result.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

            const vnpayData = {
              orderId: uniqueOrderId,
              amount: orderData.total,
              orderInfo: `Thanh toan don hang #${result.id}`,
              orderType: "billpayment",
              language: "vn",
            };

            const vnpayResponse = await createVNPayPaymentUrl(vnpayData);

            if (vnpayResponse.success && vnpayResponse.data.paymentUrl) {
              localStorage.setItem("pending_order_id", result.id);
              localStorage.removeItem("last_order");
              localStorage.removeItem("cart");
              localStorage.removeItem("checkout_items");
              localStorage.removeItem("checkout_form");

              window.location.href = vnpayResponse.data.paymentUrl;
              return;
            } else {
              throw new Error("Không thể khởi tạo cổng thanh toán VNPay lúc này");
            }
          } catch (vnpayError) {
            console.error("VNPay error:", vnpayError);
            setError("Lỗi khi kết nối cổng VNPay. Vui lòng chọn thanh toán khi nhận hàng (COD).");
            setLoading(false);
            return;
          }
        } else {
          localStorage.removeItem("last_order");
          localStorage.removeItem("cart");
          localStorage.removeItem("checkout_items");
          localStorage.removeItem("checkout_form");

          navigate("/order-success", {
            state: {
              orderId: result.id,
              orderData: orderPayload,
            },
          });
        }
      } else {
        throw new Error("Không nhận được phản hồi hợp lệ từ máy chủ");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "Đặt hàng chưa thành công. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/checkout");
  };

  const getPaymentMethodBadge = (method) => {
    switch (method) {
      case "cod":
        return { text: "💵 Thanh toán khi nhận hàng (COD)", bg: "bg-amber-50 text-amber-700 border-amber-200" };
      case "vnpay":
        return { text: "💳 Cổng VNPay (Thanh toán online)", bg: "bg-blue-50 text-blue-700 border-blue-200" };
      default:
        return { text: method, bg: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  const validateOrderItems = () => {
    if (!orderData.items || orderData.items.length === 0) return false;
    return orderData.items.every((item) => {
      const productSizesId = findProductSizeId(item.id, item.size);
      return productSizesId !== null;
    });
  };

  const isValidOrder = validateOrderItems();
  const paymentBadge = getPaymentMethodBadge(orderData.payment_method);

  const resolveImage = (img) => {
    if (!img) return "/images/placeholder.png";
    const trimmed = String(img).trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    if (trimmed.startsWith("/")) return encodeURI(trimmed);
    return `/images/${encodeURI(trimmed)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Stepper Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-center gap-2 sm:gap-6 text-xs sm:text-sm font-bold">
            <Link to="/cart" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition">
              <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">
                ✓
              </span>
              <span>Giỏ hàng</span>
            </Link>
            <span className="text-slate-300">─────</span>
            <Link to="/checkout" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition">
              <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">
                ✓
              </span>
              <span>Thông tin đặt hàng</span>
            </Link>
            <span className="text-slate-300">─────</span>
            <div className="flex items-center gap-2 text-blue-600">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                3
              </span>
              <span>Xác nhận & Hoàn tất</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center gap-2.5">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Overview Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="text-center max-w-lg mx-auto space-y-2">
            <span className="text-3xl">📝</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Xác Nhận Đơn Hàng Của Bạn
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Kiểm tra lại toàn bộ thông tin người nhận và danh sách sản phẩm trước khi hoàn tất gửi đơn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery Info */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span>📍</span>
                <span>Thông tin giao hàng</span>
              </h3>
              <p className="text-base font-black text-slate-900">{orderData.name}</p>
              <p className="text-xs text-slate-600 font-semibold">📞 {orderData.phone}</p>
              <p className="text-xs text-slate-700 leading-relaxed">
                Địa chỉ: <span className="font-medium text-slate-900">{orderData.address}</span>
              </p>
              <div className="pt-2">
                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${paymentBadge.bg}`}>
                  {paymentBadge.text}
                </span>
              </div>
            </div>

            {/* Total calculation card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white flex flex-col justify-between space-y-4 shadow-lg">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Tổng tiền thanh toán
                </span>
                <p className="text-3xl font-black mt-1">
                  {Number(orderData.total).toLocaleString("vi-VN")} ₫
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Miễn phí vận chuyển toàn quốc (Freeship)
                </p>
              </div>

              <div className="text-[11px] text-slate-300/80 space-y-1 pt-3 border-t border-white/10">
                <p>• Hỗ trợ kiểm tra hàng trước khi nhận</p>
                <p>• Đổi trả trong 60 ngày nếu không vừa size</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sản phẩm đã chọn ({orderData.items.length})
            </h3>
            <div className="space-y-2.5">
              {orderData.items.map((item, index) => {
                const productSizesId = findProductSizeId(item.id, item.size);
                const isValid = productSizesId !== null;

                return (
                  <div
                    key={index}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 transition ${
                      isValid ? "border-slate-200/80 bg-white" : "border-rose-300 bg-rose-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={resolveImage(item.image)}
                        alt={item.name}
                        className="w-14 h-14 object-cover rounded-xl border border-slate-200/60 bg-slate-50 flex-shrink-0"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/images/placeholder.png";
                        }}
                      />
                      <div>
                        <p className="font-bold text-sm text-slate-900">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                          {item.size && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
                              Size: {item.size}
                            </span>
                          )}
                          <span>x {item.quantity}</span>
                          {!isValid && (
                            <span className="text-rose-600 font-bold text-[11px]">
                              (Size chưa có trong kho)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="font-black text-sm text-blue-600">
                        {(item.price * item.quantity).toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="py-3.5 px-8 rounded-2xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
            >
              ← Quay lại chỉnh sửa
            </button>

            <button
              onClick={handleConfirm}
              disabled={loading || !isValidOrder}
              className="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Đang khởi tạo đơn hàng...</span>
                </>
              ) : (
                <>
                  <span>Hoàn Tất Đặt Hàng Ngay</span>
                  <span>⚡</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}