// src/view/Cart/Confirmation.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Thêm API để gọi lưu đơn hàng
const ORDER_API_URL = "http://localhost:3006/orders";

export default function Confirmation() {
  const navigate = useNavigate();
  const orderData = JSON.parse(localStorage.getItem("last_order"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!orderData) {
    return (
      <div className="text-center mt-20 text-gray-500">
        Không có đơn hàng nào. <span className="text-blue-500 cursor-pointer" onClick={() => navigate("/")}>Quay lại trang chủ</span>
      </div>
    );
  }

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    try {
      // Chuẩn bị dữ liệu gửi lên API
      const payload = {
        name: orderData.name,
        phone: orderData.phone,
        address: orderData.address,
        account_id: orderData.account_id || null,
        total_amount: orderData.total,
        payment_method: orderData.payment_method,
        is_paid: orderData.payment_method !== "cod", // ví dụ thanh toán online = true
        order_details: orderData.items.map(item => ({
          product_sizes_id: item.product_sizes_id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const res = await fetch(ORDER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Xóa đơn tạm
      localStorage.removeItem("last_order");
      // Xóa giỏ hàng nếu muốn sau khi xác nhận
      localStorage.removeItem("cart_items");

      navigate("/"); // chuyển về trang chủ
    } catch (err) {
      console.error(err);
      setError("Lưu đơn hàng thất bại. Vui lòng thử lại!");
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Giữ lại cart_items trong localStorage
    // Chỉ chuyển về trang thanh toán
    navigate("/checkout");
  };

  return (
    <div className="max-w-3xl mx-auto p-6 mt-10 bg-white shadow-lg rounded-xl">
      <h2 className="text-2xl font-bold text-center text-green-600 mb-6">Xác nhận đơn hàng</h2>

      {error && <p className="text-red-500 mb-3 text-center">{error}</p>}

      <p><strong>Mã đơn hàng:</strong> {orderData.orderId || "N/A"}</p>
      <p><strong>Người nhận:</strong> {orderData.name}</p>
      <p><strong>Số điện thoại:</strong> {orderData.phone}</p>
      <p><strong>Địa chỉ:</strong> {orderData.address}</p>
      <p><strong>Phương thức thanh toán:</strong> {orderData.payment_method}</p>
      <p className="font-bold text-green-600 text-lg mt-3">
        Tổng tiền: {Number(orderData.total).toLocaleString()} ₫
      </p>

      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
        >
          {loading ? "Đang lưu..." : "Xác nhận"}
        </button>

        <button
          onClick={handleCancel}
          className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500 transition"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
