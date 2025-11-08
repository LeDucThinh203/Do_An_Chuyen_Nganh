import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(storedCart);
  }, []);

  const handleRemove = (id) => {
    const newCart = cart.filter((item) => item.id !== id);
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const handleQuantityChange = (id, delta) => {
    const newCart = cart.map((item) => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta;
        return { ...item, quantity: newQuantity > 0 ? newQuantity : 1 };
      }
      return item;
    });
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const handleCheckout = () => {
    localStorage.setItem("checkout_items", JSON.stringify(cart));
    navigate("/checkout");
  };

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const visibleCart = cart.slice(0, visibleCount);

  const handleLoadMore = () => setVisibleCount((prev) => prev + 10);

  if (cart.length === 0)
    return (
      <div className="text-center mt-20 text-gray-500">
        🛒 Giỏ hàng trống. <Link to="/">Quay lại mua sắm</Link>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">🛒 Giỏ hàng của bạn</h1>
      <div className="space-y-4">
        {visibleCart.map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded shadow"
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-24 h-24 object-cover rounded"
            />
            <div className="flex-1">
              <h2 className="font-semibold text-lg">{item.name}</h2>
              <p className="text-gray-500">
                Giá: {Number(item.price).toLocaleString()} ₫
              </p>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => handleQuantityChange(item.id, -1)}
                  className="bg-red-100 text-red-600 px-2 rounded hover:bg-red-200 transition"
                >
                  -
                </button>
                <span className="px-2">{item.quantity}</span>
                <button
                  onClick={() => handleQuantityChange(item.id, 1)}
                  className="bg-green-100 text-green-600 px-2 rounded hover:bg-green-200 transition"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <p className="text-gray-700 font-medium">
                Tổng: {(item.price * item.quantity).toLocaleString()} ₫
              </p>
              <button
                onClick={() => handleRemove(item.id)}
                className="text-red-600 font-medium hover:text-red-800 transition"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {visibleCount < cart.length && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleLoadMore}
            className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition"
          >
            Xem thêm ▼
          </button>
        </div>
      )}

      <div className="mt-6 text-right text-xl font-bold">
        Tổng cộng: {Number(totalPrice).toLocaleString()} ₫
      </div>

      <div className="mt-6 flex justify-between flex-col sm:flex-row gap-4">
        <Link
          to="/"
          className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition"
        >
          Tiếp tục mua sắm
        </Link>
        <button
          onClick={handleCheckout}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
        >
          Thanh toán sản phẩm đã chọn
        </button>
      </div>
    </div>
  );
}
