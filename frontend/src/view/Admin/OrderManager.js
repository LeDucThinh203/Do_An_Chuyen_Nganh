// src/view/Admin/OrderManager.js
import React, { useState, useEffect } from "react";
import { getAllOrders, updateOrderStatus, getAllAccounts, deleteOrder } from "../../api";

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updateModal, setUpdateModal] = useState({ show: false, order: null, newStatus: "" });

  useEffect(() => {
    fetchOrdersAndAccounts();
  }, []);

  const fetchOrdersAndAccounts = async () => {
    try {
      setLoading(true);
      const [allOrders, allAccounts] = await Promise.all([
        getAllOrders(),
        getAllAccounts()
      ]);

      // Sắp xếp đơn hàng mới nhất lên đầu
      const sortedOrders = allOrders.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );

      setOrders(sortedOrders);
      setAccounts(allAccounts);
    } catch (err) {
      setError("Lỗi khi tải danh sách đơn hàng");
      console.error("Lỗi:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!updateModal.order || !updateModal.newStatus) {
      alert("Vui lòng chọn trạng thái mới!");
      return;
    }

    try {
      // Nếu chuyển từ pending sang received và là COD, tự động đánh dấu đã thanh toán
      const updateData = { status: updateModal.newStatus };
      if (updateModal.order.status === 'pending' && 
          updateModal.newStatus === 'received' && 
          updateModal.order.payment_method === 'cod') {
        updateData.is_paid = true;
      }

      await updateOrderStatus(updateModal.order.id, updateData);
      alert("Cập nhật trạng thái thành công!");
      
      // Cập nhật local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === updateModal.order.id ? { 
            ...order, 
            status: updateModal.newStatus,
            is_paid: updateData.is_paid !== undefined ? updateData.is_paid : order.is_paid
          } : order
        )
      );
      
      // Đóng modal
      setUpdateModal({ show: false, order: null, newStatus: "" });
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái: " + (err.message || "Vui lòng thử lại!"));
      console.error("Lỗi:", err);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc muốn xóa đơn hàng này? Hành động này không thể hoàn tác.")) {
      return;
    }

    try {
      await deleteOrder(orderId);
      alert("Xóa đơn hàng thành công!");
      fetchOrdersAndAccounts(); // Refresh danh sách
    } catch (err) {
      alert("Lỗi khi xóa đơn hàng: " + (err.message || "Vui lòng thử lại!"));
      console.error("Lỗi:", err);
    }
  };

  const openUpdateModal = (order) => {
    setUpdateModal({
      show: true,
      order: order,
      newStatus: order.status // Mặc định chọn trạng thái hiện tại
    });
  };

  const closeUpdateModal = () => {
    setUpdateModal({ show: false, order: null, newStatus: "" });
  };

  // Kiểm tra trạng thái thanh toán (nếu đã nhận hàng và COD thì coi như đã thanh toán)
  const getPaymentStatus = (order) => {
    if (order.is_paid) {
      return { text: 'Đã TT', color: 'text-green-600' };
    }
    if (order.status === 'received' && order.payment_method === 'cod') {
      return { text: 'Đã TT', color: 'text-green-600' };
    }
    return { text: 'Chưa TT', color: 'text-red-600' };
  };

  // Lọc đơn hàng theo trạng thái và từ khóa tìm kiếm
  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    const matchesSearch = 
      order.id.toString().includes(searchTerm) ||
      order.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone?.includes(searchTerm) ||
      order.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accounts.find(acc => acc.id === order.account_id)?.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'received': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'received': return 'Đã nhận hàng';
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

  const getUsername = (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.username : 'Không xác định';
  };

  const getTotalItems = (order) => {
    return order.order_details?.reduce((total, detail) => total + detail.quantity, 0) || 0;
  };

  // Thống kê số lượng đơn hàng theo trạng thái
  const getOrderStats = () => {
    const stats = {
      all: orders.length,
      pending: orders.filter(order => order.status === 'pending').length,
      received: orders.filter(order => order.status === 'received').length
    };
    return stats;
  };

  const orderStats = getOrderStats();

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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h2>
        <div className="text-sm text-gray-500">
          Tổng số: {filteredOrders.length} đơn hàng
        </div>
      </div>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-blue-600">{orderStats.all}</div>
          <div className="text-sm text-gray-600">Tổng đơn hàng</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-yellow-600">{orderStats.pending}</div>
          <div className="text-sm text-gray-600">Chờ xác nhận</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">{orderStats.received}</div>
          <div className="text-sm text-gray-600">Đã nhận hàng</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <button
            onClick={fetchOrdersAndAccounts}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* Bộ lọc và tìm kiếm */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <input
              type="text"
              placeholder="Tìm theo ID, tên, SĐT, địa chỉ, username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lọc theo trạng thái
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="received">Đã nhận hàng</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors w-full"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow border">
          <p className="text-gray-500 text-lg">Không tìm thấy đơn hàng nào.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Địa chỉ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const paymentStatus = getPaymentStatus(order);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{order.id}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDateTime(order.created_at)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {order.payment_method === 'cod' ? 'COD' : 'Online'} • 
                            <span className={`ml-1 ${paymentStatus.color}`}>
                              {paymentStatus.text}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {getTotalItems(order)} sản phẩm
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getUsername(order.account_id)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {order.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {order.address}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {Number(order.total_amount).toLocaleString()} ₫
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openUpdateModal(order)}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-xs"
                          >
                            Cập nhật
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors text-xs"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal cập nhật trạng thái */}
      {updateModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Cập nhật trạng thái đơn hàng</h3>
            
            {updateModal.order && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-semibold">Đơn hàng #{updateModal.order.id}</p>
                  <p className="text-sm text-gray-600">Khách hàng: {updateModal.order.name}</p>
                  <p className="text-sm text-gray-600">Tổng tiền: {Number(updateModal.order.total_amount).toLocaleString()} ₫</p>
                  <p className="text-sm text-gray-600">Phương thức: {updateModal.order.payment_method === 'cod' ? 'COD' : 'Online'}</p>
                  <p className="text-sm text-gray-600">
                    Trạng thái hiện tại: 
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${getStatusColor(updateModal.order.status)}`}>
                      {getStatusText(updateModal.order.status)}
                    </span>
                  </p>
                  {updateModal.order.payment_method === 'cod' && updateModal.newStatus === 'received' && (
                    <p className="text-sm text-green-600 font-medium mt-1">
                      ⓘ Khi chuyển sang "Đã nhận hàng", đơn hàng COD sẽ tự động được đánh dấu là "Đã thanh toán"
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn trạng thái mới:
                  </label>
                  <select
                    value={updateModal.newStatus}
                    onChange={(e) => setUpdateModal(prev => ({ ...prev, newStatus: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Chờ xác nhận</option>
                    <option value="received">Đã nhận hàng</option>
                  </select>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    onClick={closeUpdateModal}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleUpdateStatus}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Xác nhận cập nhật
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}