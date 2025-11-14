// src/view/User/OrderManager.js
import React, { useState, useEffect } from "react";
import { getAllOrders, deleteOrder } from "../../api";
import Session from "../../Session/session";

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [displayedOrders, setDisplayedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [visibleCount, setVisibleCount] = useState(8);

  const user = Session.getUser();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    setDisplayedOrders(orders.slice(0, visibleCount));
  }, [orders, visibleCount]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await getAllOrders();
      
      const userOrders = allOrders
        .filter(order => order.account_id === user.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setOrders(userOrders);
    } catch (err) {
      setError("Lỗi khi tải danh sách đơn hàng");
      console.error("Lỗi:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedOrder(null);
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc muốn hủy đơn hàng này? Hành động này không thể hoàn tác.")) {
      return;
    }

    try {
      await deleteOrder(orderId);
      alert("Hủy đơn hàng thành công!");
      fetchOrders(); // Refresh danh sách
    } catch (err) {
      alert("Lỗi khi hủy đơn hàng: " + (err.message || "Vui lòng thử lại!"));
      console.error("Lỗi:", err);
    }
  };

  const loadMoreOrders = () => {
    setVisibleCount(prev => prev + 8);
  };

  const collapseOrders = () => {
    setVisibleCount(8);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'received': return 'Đã nhận hàng';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  // Kiểm tra trạng thái thanh toán (nếu đã nhận hàng và COD thì coi như đã thanh toán)
  const getPaymentStatus = (order) => {
    // Đã thanh toán qua VNPay (hoặc đã chọn VNPay)
    if (order.payment_method === 'vnpay') {
      return { text: 'Đã TT', color: 'text-green-600', canView: true };
    }
    // Đã thanh toán (is_paid = 1) hoặc thanh toán qua bank
    if (order.is_paid || order.payment_method === 'bank') {
      return { text: 'Đã TT', color: 'text-green-600', canView: true };
    }
    // COD và đã nhận hàng
    if (order.status === 'received' && order.payment_method === 'cod') {
      return { text: 'Đã TT', color: 'text-green-600', canView: true };
    }
    return { text: 'Chưa TT', color: 'text-red-600', canView: false };
  };

  // Hàm lấy thông tin ngân hàng từ payment_info
  const getBankCode = (order) => {
    if ((order.payment_method !== 'bank' && order.payment_method !== 'vnpay') || !order.payment_info) {
      return null;
    }
    try {
      const paymentInfo = JSON.parse(order.payment_info);
      return paymentInfo.bankCode || paymentInfo.vnpay_bank_code || null;
    } catch (error) {
      console.error('Error parsing payment_info:', error);
      return null;
    }
  };

  // Kiểm tra xem user có thể hủy đơn hàng không
  const canCancelOrder = (order) => {
    // Chỉ có thể hủy khi đơn hàng đang pending
    return order.status === 'pending';
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayedOrders.map((order) => {
              const paymentStatus = getPaymentStatus(order);
              const bankCode = getBankCode(order);
              return (
                <div key={order.id} className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                  {/* Header đơn hàng */}
                  <div className="bg-gradient-to-r from-blue-50 to-gray-50 px-4 py-3 border-b">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">
                          Đơn hàng #{order.id}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(order.created_at)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-600">
                        {Number(order.total_amount).toLocaleString()} ₫
                      </span>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-500">
                          Ngày đặt: {formatDate(order.created_at)}
                        </span>
                        <span className={`text-xs ${paymentStatus.color}`}>
                          {paymentStatus.text}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Thông tin giao hàng */}
                  <div className="bg-gray-50 px-3 py-2 border-t">
                    <div className="space-y-1 text-xs">
                      <p className="text-gray-600 truncate">
                        <strong>{order.name}</strong>
                      </p>
                      <p className="text-gray-500 truncate" title={order.address}>
                        {order.address}
                      </p>
                      <div className="flex justify-between text-gray-500">
                        <span>
                          {order.payment_method === 'cod' 
                            ? 'COD' 
                            : (order.payment_method === 'vnpay' 
                                ? (bankCode ? `Bank (VN Pay - ${bankCode})` : 'Bank (VN Pay)') 
                                : (bankCode ? `Bank (${bankCode})` : 'Bank'))}
                        </span>
                        <span className={paymentStatus.color}>
                          {paymentStatus.text}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nút hành động */}
                  <div className="px-3 py-2 bg-white border-t flex gap-2">
                    {/* Nút xem chi tiết - chỉ hiển thị khi đã thanh toán */}
                    {paymentStatus.canView && (
                      <button
                        onClick={() => handleShowDetail(order)}
                        className="flex-1 bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700 transition-colors"
                      >
                        Xem chi tiết
                      </button>
                    )}
                    
                    {/* Nút hủy đơn hàng - chỉ hiển thị khi pending */}
                    {canCancelOrder(order) && (
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className={`bg-red-600 text-white text-xs py-1 px-2 rounded hover:bg-red-700 transition-colors ${
                          paymentStatus.canView ? 'flex-1' : 'w-full'
                        }`}
                      >
                        Hủy đơn
                      </button>
                    )}

                    {/* Thông báo khi không có hành động nào */}
                    {!paymentStatus.canView && !canCancelOrder(order) && (
                      <div className="w-full text-center text-xs text-gray-500 py-1">
                        Không có hành động
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nút load more và thu gọn */}
          <div className="flex justify-center mt-6 gap-4">
            {visibleCount < orders.length && (
              <button
                onClick={loadMoreOrders}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <span>Xem thêm đơn hàng ({orders.length - visibleCount} đơn còn lại)</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
            )}
            
            {visibleCount > 8 && (
              <button
                onClick={collapseOrders}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                </svg>
                <span>Thu gọn</span>
              </button>
            )}
          </div>

          <div className="text-center text-gray-500 text-sm">
            Hiển thị {Math.min(visibleCount, orders.length)} trong tổng số {orders.length} đơn hàng
          </div>
        </>
      )}

      {/* Modal chi tiết đơn hàng */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Chi tiết đơn hàng #{selectedOrder.id}</h3>
                <button
                  onClick={handleCloseDetail}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Thông tin đơn hàng */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Thông tin đơn hàng</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <strong>Ngày đặt:</strong> {formatDateTime(selectedOrder.created_at)}
                    </div>
                    <div>
                      <strong>Trạng thái:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusText(selectedOrder.status)}
                      </span>
                    </div>
                    <div>
                      <strong>Tổng tiền:</strong> {Number(selectedOrder.total_amount).toLocaleString()} ₫
                    </div>
                    <div>
                      <strong>Thanh toán:</strong> 
                      <span className={getPaymentStatus(selectedOrder).color + ' ml-2'}>
                        {getPaymentStatus(selectedOrder).text}
                      </span>
                    </div>
                    <div>
                      <strong>Phương thức TT:</strong> {
                        selectedOrder.payment_method === 'cod' 
                          ? 'Thanh toán khi nhận hàng (COD)' 
                          : getBankCode(selectedOrder) 
                            ? `Thanh toán qua ngân hàng ${getBankCode(selectedOrder)} (VNPay)` 
                            : 'Thanh toán qua ngân hàng (Bank)'
                      }
                    </div>
                  </div>
                </div>

                {/* Thông tin giao hàng chi tiết */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Thông tin giao hàng</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Người nhận:</strong> {selectedOrder.name}</p>
                    <p><strong>Số điện thoại:</strong> {selectedOrder.phone}</p>
                    <p><strong>Địa chỉ:</strong> {selectedOrder.address}</p>
                  </div>
                </div>
              </div>

              <div className="modal-action mt-6">
                <button
                  onClick={handleCloseDetail}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}