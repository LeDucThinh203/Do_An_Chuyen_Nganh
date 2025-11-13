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

  // Nhóm sản phẩm theo id và size để hiển thị
  const groupedCart = visibleCart.reduce((acc, item) => {
    const key = `${item.id}-${item.size || 'no-size'}`;
    if (!acc[key]) {
      acc[key] = { ...item };
    } else {
      acc[key].quantity += item.quantity;
    }
    return acc;
  }, {});

  const groupedCartArray = Object.values(groupedCart);

  if (cart.length === 0)
    return (
      <div className="text-center mt-20 text-gray-500">
        🛒 Giỏ hàng trống. <Link to="/" className="text-blue-600 hover:underline">Quay lại mua sắm</Link>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">🛒 Giỏ hàng của bạn</h1>
      
      <div className="space-y-4">
        {groupedCartArray.map((item) => (
          <div
            key={`${item.id}-${item.size || 'no-size'}`}
            className="flex flex-col sm:flex-row items-center gap-4 bg-white p-6 rounded-lg shadow-md border border-gray-200"
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-24 h-24 object-cover rounded-lg"
            />
            
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-lg text-gray-900 mb-2">
                {item.name}
              </h2>
              
              {/* Hiển thị size giống như trong ảnh */}
              {item.size && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">Size: </span>
                  <span className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded border">
                    {item.size}
                  </span>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Đơn giá:</span>
                  <span className="text-red-600 font-semibold">
                    {Number(item.price).toLocaleString()} ₫
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Số lượng:</span>
                  <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.size, -1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition rounded-l"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 min-w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.size, 1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition rounded-r"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-3 min-w-[120px]">
              <div className="text-right">
                <span className="text-sm font-medium text-gray-700">Tổng:</span>
                <p className="text-lg font-bold text-red-600">
                  {(item.price * item.quantity).toLocaleString()} ₫
                </p>
              </div>
              
              <button
                onClick={() => handleRemove(item.id, item.size)}
                className="text-red-600 font-medium hover:text-red-800 transition flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {visibleCount < cart.length && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleLoadMore}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition font-medium"
          >
            Xem thêm sản phẩm ▼
          </button>
        </div>
      )}

      {/* Tổng tiền */}
      <div className="mt-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-semibold text-gray-900">Tổng tiền:</span>
          <span className="text-2xl font-bold text-red-600">
            {Number(totalPrice).toLocaleString()} ₫
          </span>
        </div>
        
        <div className="flex justify-between flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
          <Link
            to="/"
            className="bg-gray-800 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition font-medium text-center"
          >
            ← Tiếp tục mua sắm
          </Link>
          <button
            onClick={handleCheckout}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition font-medium text-center"
          >
            Thanh toán sản phẩm đã chọn →
          </button>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        © 2025 Quản lý sản phẩm. All rights reserved.
      </div>
    </div>
  );
}