// src/view/Cart/Cart.js
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllProductSizes } from "../../api";
import { useCart } from "../../context/CartContext";
import { handleImageError, resolveImageUrl as resolveImage } from "../../utils/imageUrl";

export default function Cart() {
  const { items: cart, loading, error, refreshCart, removeItem, updateQuantity } = useCart();
  const [visibleCount, setVisibleCount] = useState(10);
  const [productSizes, setProductSizes] = useState([]);
  const [cartActionError, setCartActionError] = useState("");
  const navigate = useNavigate();
  const productIdsKey = useMemo(() => [...new Set(cart.map((item) => String(item.id)))].join(","), [cart]);

  useEffect(() => {
    if (!productIdsKey) {
      setProductSizes([]);
      return undefined;
    }
    let active = true;
    getAllProductSizes(productIdsKey.split(","))
      .then((sizes) => { if (active) setProductSizes(sizes); })
      .catch((loadError) => console.error("Kh\u00f4ng th\u1ec3 t\u1ea3i t\u1ed3n kho:", loadError));
    return () => { active = false; };
  }, [productIdsKey]);

  const handleRemove = async (item) => {
    setCartActionError("");
    try {
      await removeItem(item);
    } catch (actionError) {
      setCartActionError(actionError.message || "Kh\u00f4ng th\u1ec3 x\u00f3a s\u1ea3n ph\u1ea9m kh\u1ecfi gi\u1ecf h\u00e0ng.");
    }
  };

  const handleQuantityChange = async (item, delta) => {
    const stock = getStockForItem(item);
    const quantity = Math.max(1, Math.min(Number(item.quantity) + delta, stock));
    if (quantity === Number(item.quantity)) return;
    setCartActionError("");
    try {
      await updateQuantity(item, quantity);
    } catch (actionError) {
      setCartActionError(actionError.message || "Kh\u00f4ng th\u1ec3 c\u1eadp nh\u1eadt s\u1ed1 l\u01b0\u1ee3ng.");
    }
  };

  const getStockForItem = (item) => {
    const matched = productSizes.find(
      (ps) => String(ps.product_id) === String(item.id) && ps.size === (item.size || "")
    );
    return Number(item.stock ?? matched?.stock ?? 0);
  };

  const isOutOfStock = (item) => item.available === false || getStockForItem(item) <= 0;

  const purchasableItems = cart.filter((i) => !isOutOfStock(i));

  const handleCheckout = () => {
    if (purchasableItems.length === 0) return;
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

  if (loading && cart.length === 0) {
    return <div className="min-h-[60vh] flex items-center justify-center text-slate-500">Loading cart...</div>;
  }

  if (error && cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-rose-600">{error}</p>
        <button type="button" onClick={() => refreshCart().catch(() => {})} className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white">
          Retry
        </button>
      </div>
    );
  }

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
            Giỏ hàng chưa có sản phẩm. Hãy duyệt danh mục và chọn size phù hợp trước khi thêm vào giỏ.
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
    <div className="cart-page min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {(cartActionError || error) && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
            {cartActionError || error}
          </div>
        )}
        {/* Checkout Progress Stepper */}
        <div className="checkout-stepper bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
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

            {purchasableItems.length === 0 && (
              <div className="cart-stock-alert" role="status">
                Các sản phẩm trong giỏ hiện đã hết hàng. Bạn có thể xóa sản phẩm này hoặc quay lại chọn size còn hàng.
              </div>
            )}

            {groupedCartArray.map((item) => {
              const out = isOutOfStock(item);
              return (
                <div
                  key={`${item.id}-${item.size || "no-size"}`}
                  className={`cart-item-card bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-center gap-5 relative ${
                    out ? "opacity-60 bg-slate-50/50" : ""
                  }`}
                >
                  <img
                    src={resolveImage(item.image)}
                    alt={item.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl border border-slate-100 bg-slate-100 flex-shrink-0"
                    onError={handleImageError}
                  />

                  <div className="flex-1 min-w-0 w-full space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900 hover:text-blue-600 transition truncate">
                        {item.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleRemove(item)}
                        aria-label={`Xóa ${item.name} khỏi giỏ hàng`}
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
                          type="button"
                          onClick={() => !out && handleQuantityChange(item, -1)}
                          disabled={out || item.quantity <= 1}
                          aria-label={`Giảm số lượng ${item.name}`}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg font-bold transition disabled:opacity-40"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-bold text-xs text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => !out && handleQuantityChange(item, 1)}
                          disabled={out}
                          aria-label={`Tăng số lượng ${item.name}`}
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
            <div className="cart-summary bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xl space-y-5 lg:sticky lg:top-28">
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
                  <span className="font-bold text-emerald-600">0 ₫</span>
                </div>
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
                  <span>Kiểm tra tồn kho trước khi thanh toán</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>⚡</span>
                  <span>Thanh toán COD hoặc VNPay</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
