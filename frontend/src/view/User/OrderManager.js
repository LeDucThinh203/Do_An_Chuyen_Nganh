// src/view/User/OrderManager.js
import React, { useState, useEffect } from "react";
import { getAllOrders, createRating } from "../../api";
import Session from "../../Session/session";

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingData, setRatingData] = useState({
    order_detail_id: null,
    rating_value: 0,
    comment: ""
  });

  const user = Session.getUser();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await getAllOrders();
      // Lọc đơn hàng của user hiện tại
      const userOrders = allOrders.filter(order => order.account_id === user.id);
      setOrders(userOrders);
    } catch (err) {
      setError("Lỗi khi tải danh sách đơn hàng");
      console.error("Lỗi:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowRating = (orderDetail) => {
    setRatingData({
      order_detail_id: orderDetail.order_detail_id,
      rating_value: 0,
      comment: ""
    });
    setShowRatingModal(true);
  };

  const handleRatingSubmit = async () => {
    try {
      if (ratingData.rating_value === 0) {
        alert("Vui lòng chọn số sao đánh giá!");
        return;
      }

      await createRating(ratingData);
      alert("Đánh giá thành công!");
      setShowRatingModal(false);
      // Có thể cập nhật lại danh sách đơn hàng để hiển thị đánh giá
      fetchOrders();
    } catch (err) {
      alert("Lỗi khi gửi đánh giá!");
      console.error("Lỗi:", err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipping': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'shipping': return 'Đang giao hàng';
      case 'delivered': return 'Đã giao hàng';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`text-xl ${
          index < rating ? 'text-yellow-400' : 'text-gray-300'
        }`}
      >
        ★
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng của tôi</h2>

      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">Bạn chưa có đơn hàng nào.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white shadow-lg rounded-lg overflow-hidden">
              {/* Header đơn hàng */}
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Mã đơn hàng: #{order.id}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Ngày đặt: {formatDate(order.created_at || order.order_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-2 sm:mt-0">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      {Number(order.total_amount).toLocaleString()} ₫
                    </span>
                  </div>
                </div>
              </div>

              {/* Chi tiết đơn hàng */}
              <div className="p-6">
                <div className="space-y-4">
                  {order.order_details && order.order_details.map((detail, index) => (
                    <div key={index} className="flex items-center gap-4 border-b pb-4 last:border-b-0">
                      <img
                        src={detail.image}
                        alt={detail.product_name}
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{detail.product_name}</h4>
                        {detail.size && (
                          <p className="text-sm text-gray-600">
                            Size: <span className="font-medium">{detail.size}</span>
                          </p>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-sm text-gray-500">
                            Số lượng: {detail.quantity} × {Number(detail.price).toLocaleString()} ₫
                          </div>
                          <div className="text-red-600 font-semibold">
                            {(detail.quantity * detail.price).toLocaleString()} ₫
                          </div>
                        </div>
                        
                        {/* Đánh giá */}
                        <div className="mt-3">
                          {detail.rating ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">Đánh giá của bạn:</span>
                              <div className="flex">
                                {renderStars(detail.rating.rating_value)}
                              </div>
                              {detail.rating.comment && (
                                <p className="text-sm text-gray-600">"{detail.rating.comment}"</p>
                              )}
                            </div>
                          ) : (
                            order.status === 'delivered' && (
                              <button
                                onClick={() => handleShowRating(detail)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                </svg>
                                Đánh giá sản phẩm
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Thông tin giao hàng */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Thông tin giao hàng</h4>
                  <p className="text-sm text-gray-600">
                    <strong>Người nhận:</strong> {order.name} - {order.phone}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Địa chỉ:</strong> {order.address}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Phương thức thanh toán:</strong> {order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : 'Thanh toán online'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Trạng thái thanh toán:</strong> {order.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal đánh giá */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Đánh giá sản phẩm</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn số sao:
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRatingData(prev => ({ ...prev, rating_value: star }))}
                    className={`text-3xl ${
                      star <= ratingData.rating_value ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-500 transition-colors`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhận xét (không bắt buộc):
              </label>
              <textarea
                value={ratingData.comment}
                onChange={(e) => setRatingData(prev => ({ ...prev, comment: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRatingModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleRatingSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Gửi đánh giá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}