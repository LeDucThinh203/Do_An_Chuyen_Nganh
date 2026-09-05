// src/view/Cart/Cart.js
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllProductSizes, getAllSizes } from "../../api";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [sizes, setSizes] = useState([]);
  const [productSizes, setProductSizes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(storedCart);
    (async () => {
      try {
        const [sizesData, psData] = await Promise.all([
          getAllSizes(),
          getAllProductSizes()
        ]);
        setSizes(sizesData);
        setProductSizes(psData);
      } catch (e) {
        console.error("Không thể tải tồn kho:", e);
      }
    })();
  }, []);

  const handleRemove = (id, size = "") => {
    const newCart = cart.filter((item) => 
      !(item.id === id && item.size === size)
    );
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const handleQuantityChange = (id, size, delta) => {
    const newCart = cart.map((item) => {
      if (item.id === id && item.size === size) {
        const stock = getStockForItem(item);
        const newQuantity = item.quantity + delta;
        const finalQuantity = Math.max(1, Math.min(newQuantity, stock));
        return { ...item, quantity: finalQuantity };
      }
      return item;
    });
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const getStockForItem = (item) => {
    const matched = productSizes.find(
      (ps) => ps.product_id === item.id && (sizes.find((s) => s.id === ps.size_id)?.size === (item.size || ""))
    );
    return Number(matched?.stock ?? 0);
  };

  const isOutOfStock = (item) => getStockForItem(item) <= 0;

  const purchasableItems = cart.filter((i) => !isOutOfStock(i));

  const handleCheckout = () => {
    if (purchasableItems.length === 0) {
      alert("Giỏ hàng chỉ toàn sản phẩm hết hàng. Vui lòng chọn sản phẩm khác hoặc liên hệ CSKH.");
      return;
    }
    localStorage.setItem("checkout_items", JSON.stringify(purchasableItems));
    navigate("/checkout");
  };

  const totalPrice = purchasableItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const visibleCart = cart.slice(0, visibleCount);

  const handleLoadMore = () => setVisibleCount((prev) => prev + 10);

  const groupedCart = visibleCart.reduce((acc, item) => {
    const key = `${item.id}-${item.size || "no-size"}`;
    if (!acc[key]) {
      acc[key] = { ...item };
    } else {
      acc[key].quantity += item.quantity;
    }
    return acc;
  }, {});

  const groupedCartArray = Object.values(groupedCart);

  const resolveImage = (img) => {
    if (!img) return "/images/placeholder.png";
    const trimmed = String(img).trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    if (trimmed.startsWith("/")) return encodeURI(trimmed);
    return `/images/${encodeURI(trimmed)}`;
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center max-w-lg w-full border border-slate-200/80 shadow-xl space-y-5">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center text-4xl shadow-inner">
            🛒
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Giỏ Hàng Đang Trống
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
            Bạn chưa chọn món đồ thể thao nào. Hãy khám phá ngay bộ sưu tập thể thao Pro Athletic 2026!
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-full shadow-lg shadow-blue-500/25 hover:scale-105 transition"
          >
            <span>Khám phá mua sắm ngay</span>
            <span>⚡</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Checkout Progress Stepper */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-center gap-2 sm:gap-6 text-xs sm:text-sm font-bold">
            <div className="flex items-center gap-2 text-blue-600">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                1
              </span>
              <span>Giỏ hàng ({cart.length})</span>
            </div>
            <span className="text-slate-300">─────</span>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">
                2
              </span>
              <span>Thông tin đặt hàng</span>
            </div>
            <span className="text-slate-300">─────</span>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">
                3
              </span>
              <span>Hoàn tất đơn</span>
            </div>
          </div>
        </div>

        {/* Main Grid: Cart items & Checkout Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Items List */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between pb-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>🛍️</span>
                <span>Sản Phẩm Trong Giỏ</span>
              </h1>
              <span className="text-xs font-semibold text-slate-500">
                {purchasableItems.length} sản phẩm khả dụng
              </span>
            </div>

            {groupedCartArray.map((item) => {
              const out = isOutOfStock(item);
              return (
                <div
                  key={`${item.id}-${item.size || "no-size"}`}
                  className={`bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-center gap-5 relative ${
                    out ? "opacity-60 bg-slate-50/50" : ""
                  }`}
                >
                  <img
                    src={resolveImage(item.image)}
                    alt={item.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl border border-slate-100 bg-slate-100 flex-shrink-0"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/images/placeholder.png";
                    }}
                  />

                  <div className="flex-1 min-w-0 w-full space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900 hover:text-blue-600 transition truncate">
                        {item.name}
                      </h3>
                      <button
                        onClick={() => handleRemove(item.id, item.size)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                        title="Xóa sản phẩm này"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {item.size && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80">
                          Kích cỡ: {item.size}
                        </span>
                      )}
                      {out ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                          Tạm hết hàng
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Còn hàng
                        </span>
                      )}
                    </div>

                    {/* Pricing & Quantity Row */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">
                          {Number(item.price).toLocaleString("vi-VN")} ₫
                        </span>
                        {item.original_price && item.original_price !== item.price && (
                          <span className="text-xs text-slate-400 line-through">
                            {Number(item.original_price).toLocaleString("vi-VN")} ₫
                          </span>
                        )}
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                        <button
                          onClick={() => !out && handleQuantityChange(item.id, item.size, -1)}
                          disabled={out || item.quantity <= 1}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg font-bold transition disabled:opacity-40"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-bold text-xs text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => !out && handleQuantityChange(item.id, item.size, 1)}
                          disabled={out}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg font-bold transition disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal for item */}
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block font-semibold">Thành tiền:</span>
                        <span className="text-base font-black text-blue-600">
                          {((out ? 0 : item.price * item.quantity)).toLocaleString("vi-VN")} ₫
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {visibleCount < cart.length && (
              <div className="text-center pt-2">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-50 shadow-sm transition"
                >
                  Xem thêm {cart.length - visibleCount} sản phẩm nữa ↓
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary Card */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xl space-y-5 sticky top-28">
              <h2 className="text-lg font-extrabold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
                <span>Tóm Tắt Đơn Hàng</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                  {purchasableItems.length} món
                </span>
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Tạm tính hàng hóa:</span>
                  <span className="font-bold text-slate-900">
                    {Number(totalPrice).toLocaleString("vi-VN")} ₫
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Phí vận chuyển:</span>
                  <span className="font-bold text-emerald-600">
                    {totalPrice >= 299000 ? "Miễn phí (Freeship)" : "Theo khu vực"}
                  </span>
                </div>

                {totalPrice >= 299000 && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                    <span>🎉</span>
                    <span>Đơn hàng đủ điều kiện FREESHIP toàn quốc!</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Tổng thanh toán:</span>
                  <span className="text-2xl font-black text-blue-600">
                    {Number(totalPrice).toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleCheckout}
                  disabled={purchasableItems.length === 0}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Tiến Hành Đặt Hàng</span>
                  <span>→</span>
                </button>

                <Link
                  to="/"
                  className="block w-full py-3 px-6 rounded-2xl text-center text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  ← Tiếp tục mua sắm thêm đồ
                </Link>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <span>🛡️</span>
                  <span>Đổi trả 60 ngày miễn phí tận nơi</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>⚡</span>
                  <span>Giao hàng hỏa tốc trong 2h tại TP.HCM & HN</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}