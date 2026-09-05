// src/view/Admin/OrderManager.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllOrders, updateOrderStatus, getAllAccounts, deleteOrder } from "../../api";
import { OrderManagerSkeleton } from "../common/Skeletons";

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all"); // all, bank, cod
  const [searchTerm, setSearchTerm] = useState("");
  const [updateModal, setUpdateModal] = useState({ show: false, order: null, newStatus: "" });
  const [detailModal, setDetailModal] = useState({ show: false, order: null });
  const [visibleCountBank, setVisibleCountBank] = useState(5);
  const [visibleCountCOD, setVisibleCountCOD] = useState(5);

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
      
      // Reset bộ lọc về mặc định
      setFilterStatus("all");
      setFilterPayment("all");
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
      // Cập nhật is_paid: received = 0, các trạng thái khác = 1
      const updateData = { 
        status: updateModal.newStatus,
        is_paid: updateModal.newStatus === 'received' ? 0 : 1
      };

      await updateOrderStatus(updateModal.order.id, updateData);
      alert("Cập nhật trạng thái thành công!");
      
      // Cập nhật local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === updateModal.order.id ? { 
            ...order, 
            status: updateModal.newStatus,
            is_paid: updateData.is_paid
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

  const openDetailModal = (order) => {
    setDetailModal({ show: true, order: order });
  };

  const closeDetailModal = () => {
    setDetailModal({ show: false, order: null });
  };

  // Kiểm tra trạng thái thanh toán
  const getPaymentStatus = (order) => {
    // COD: CHỈ kiểm tra status, KHÔNG dựa vào is_paid
    if (order.payment_method === 'cod') {
      if (order.status === 'received') {
        return { text: 'Đã TT', color: 'text-green-600' };
      } else {
        return { text: 'Chưa TT', color: 'text-red-600' };
      }
    }
    // VNPay: luôn đã thanh toán
    if (order.payment_method === 'vnpay') {
      return { text: 'Đã TT', color: 'text-green-600' };
    }
    // Bank: luôn đã thanh toán
    if (order.payment_method === 'bank') {
      return { text: 'Đã TT', color: 'text-green-600' };
    }
    // Các trường hợp khác kiểm tra is_paid
    if (order.is_paid) {
      return { text: 'Đã TT', color: 'text-green-600' };
    }
    return { text: 'Chưa TT', color: 'text-red-600' };
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

  // Lọc đơn hàng theo trạng thái và từ khóa tìm kiếm
  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    const matchesPayment = filterPayment === "all" || 
      (filterPayment === "bank" && (order.payment_method === 'bank' || order.payment_method === 'vnpay')) ||
      (filterPayment === "cod" && order.payment_method === 'cod');
    const matchesSearch = 
      order.id.toString().includes(searchTerm) ||
      order.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone?.includes(searchTerm) ||
      order.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accounts.find(acc => acc.id === order.account_id)?.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPayment && matchesSearch;
  });

  // Tách đơn hàng theo phương thức thanh toán
  const bankOrders = filteredOrders.filter(order => order.payment_method === 'bank' || order.payment_method === 'vnpay');
  const codOrders = filteredOrders.filter(order => order.payment_method === 'cod');

  const visibleBankOrders = bankOrders.slice(0, visibleCountBank);
  const visibleCODOrders = codOrders.slice(0, visibleCountCOD);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipping': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'received': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'shipping': return 'Đang giao hàng';
      case 'received': return 'Đã giao thành công';
      default: return status;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getUsername = (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.username : 'Không xác định';
  };

  // Hàm xử lý đường dẫn hình ảnh
  const resolveImage = (img) => {
    if (!img) return '/images/placeholder.png';
    const trimmed = String(img).trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('/')) return encodeURI(trimmed);
    return `/images/${encodeURI(trimmed)}`;
  };

  // Thống kê số lượng đơn hàng theo trạng thái
  const getOrderStats = () => {
    const stats = {
      all: orders.length,
      pending: orders.filter(order => order.status === 'pending').length,
      confirmed: orders.filter(order => order.status === 'confirmed').length,
      shipping: orders.filter(order => order.status === 'shipping').length,
      received: orders.filter(order => order.status === 'received').length,
      bank: orders.filter(order => order.payment_method === 'bank' || order.payment_method === 'vnpay').length,
      cod: orders.filter(order => order.payment_method === 'cod').length
    };
    return stats;
  };

  const orderStats = getOrderStats();

  if (loading) {
    return <OrderManagerSkeleton />;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
        <div>
          <h2 className="text-xl font-black text-slate-900">Quản Lý Đơn Hàng</h2>
          <p className="text-xs text-slate-500 mt-0.5">Theo dõi, điều phối và xử lý đơn hàng toàn hệ thống</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            Tổng cộng: <strong className="text-slate-900 font-black">{filteredOrders.length}</strong> đơn hàng
          </span>
        </div>
      </div>

      {/* Thống kê nhanh / Quick Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Tất cả */}
        <button
          onClick={() => {
            if (filterStatus === "all" && filterPayment === "all") return;
            setFilterStatus("all");
            setFilterPayment("all");
          }}
          className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
            filterStatus === "all" && filterPayment === "all"
              ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-base">📦</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${filterStatus === "all" && filterPayment === "all" ? 'text-blue-600' : 'text-slate-400'}`}>Tất cả</span>
          </div>
          <div>
            <div className={`text-xl font-black ${filterStatus === "all" && filterPayment === "all" ? 'text-blue-600' : 'text-slate-900'}`}>
              {orderStats.all}
            </div>
            <div className="text-[11px] font-medium text-slate-500 truncate">Tổng đơn hàng</div>
          </div>
        </button>
        
        {/* Chờ xác nhận */}
        <button
          onClick={() => {
            if (filterStatus === "pending") setFilterStatus("all");
            else setFilterStatus("pending");
          }}
          className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
            filterStatus === "pending"
              ? 'bg-amber-50/60 border-amber-500 ring-2 ring-amber-500 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-base">⏳</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${filterStatus === "pending" ? 'text-amber-600' : 'text-slate-400'}`}>Chờ duyệt</span>
          </div>
          <div>
            <div className={`text-xl font-black ${filterStatus === "pending" ? 'text-amber-600' : 'text-slate-900'}`}>
              {orderStats.pending}
            </div>
            <div className="text-[11px] font-medium text-slate-500 truncate">Chờ xác nhận</div>
          </div>
        </button>
        
        {/* Đã xác nhận */}
        <button
          onClick={() => {
            if (filterStatus === "confirmed") setFilterStatus("all");
            else setFilterStatus("confirmed");
          }}
          className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
            filterStatus === "confirmed"
              ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-base">📋</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${filterStatus === "confirmed" ? 'text-blue-600' : 'text-slate-400'}`}>Đã duyệt</span>
          </div>
          <div>
            <div className={`text-xl font-black ${filterStatus === "confirmed" ? 'text-blue-600' : 'text-slate-900'}`}>
              {orderStats.confirmed}
            </div>
            <div className="text-[11px] font-medium text-slate-500 truncate">Đã xác nhận</div>
          </div>
        </button>
        
        {/* Đang giao hàng */}
        <button
          onClick={() => {
            if (filterStatus === "shipping") setFilterStatus("all");
            else setFilterStatus("shipping");
          }}
          className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
            filterStatus === "shipping"
              ? 'bg-purple-50/60 border-purple-500 ring-2 ring-purple-500 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-base">🚚</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${filterStatus === "shipping" ? 'text-purple-600' : 'text-slate-400'}`}>Vận chuyển</span>
          </div>
          <div>
            <div className={`text-xl font-black ${filterStatus === "shipping" ? 'text-purple-600' : 'text-slate-900'}`}>
              {orderStats.shipping}
            </div>
            <div className="text-[11px] font-medium text-slate-500 truncate">Đang giao hàng</div>
          </div>
        </button>
        
        {/* Đã giao thành công */}
        <button
          onClick={() => {
            if (filterStatus === "received") setFilterStatus("all");
            else setFilterStatus("received");
          }}
          className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
            filterStatus === "received"
              ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-base">✅</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${filterStatus === "received" ? 'text-emerald-600' : 'text-slate-400'}`}>Hoàn tất</span>
          </div>
          <div>
            <div className={`text-xl font-black ${filterStatus === "received" ? 'text-emerald-600' : 'text-slate-900'}`}>
              {orderStats.received}
            </div>
            <div className="text-[11px] font-medium text-slate-500 truncate">Đã giao hàng</div>
          </div>
        </button>
        
        {/* Bank Transfer */}
        <button
          onClick={() => {
            if (filterPayment === "bank") setFilterPayment("all");
            else setFilterPayment("bank");
          }}
          className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
            filterPayment === "bank"
              ? 'bg-indigo-50/60 border-indigo-500 ring-2 ring-indigo-500 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-base">💳</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${filterPayment === "bank" ? 'text-indigo-600' : 'text-slate-400'}`}>Ngân hàng</span>
          </div>
          <div>
            <div className={`text-xl font-black ${filterPayment === "bank" ? 'text-indigo-600' : 'text-slate-900'}`}>
              {orderStats.bank}
            </div>
            <div className="text-[11px] font-medium text-slate-500 truncate">Bank Transfer</div>
          </div>
        </button>
        
        {/* COD */}
        <button
          onClick={() => {
            if (filterPayment === "cod") setFilterPayment("all");
            else setFilterPayment("cod");
          }}
          className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
            filterPayment === "cod"
              ? 'bg-teal-50/60 border-teal-500 ring-2 ring-teal-500 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-base">💵</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${filterPayment === "cod" ? 'text-teal-600' : 'text-slate-400'}`}>Tiền mặt</span>
          </div>
          <div>
            <div className={`text-xl font-black ${filterPayment === "cod" ? 'text-teal-600' : 'text-slate-900'}`}>
              {orderStats.cod}
            </div>
            <div className="text-[11px] font-medium text-slate-500 truncate">COD</div>
          </div>
        </button>
      </div>

      {/* Bộ lọc và tìm kiếm */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
        {/* Hiển thị bộ lọc đang áp dụng */}
        {(filterStatus !== "all" || filterPayment !== "all" || searchTerm) && (
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đang lọc:</span>
            {filterStatus !== "all" && (
              <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/70">
                Trạng thái: {getStatusText(filterStatus)}
                <button
                  onClick={() => setFilterStatus("all")}
                  className="ml-1.5 hover:text-amber-900 font-black text-sm"
                >
                  ×
                </button>
              </span>
            )}
            {filterPayment !== "all" && (
              <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold border ${
                filterPayment === "bank" ? "bg-blue-50 text-blue-800 border-blue-200/70" : "bg-emerald-50 text-emerald-800 border-emerald-200/70"
              }`}>
                {filterPayment === "bank" ? "Bank Transfer" : "COD"}
                <button
                  onClick={() => setFilterPayment("all")}
                  className="ml-1.5 font-black text-sm"
                >
                  ×
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                Tìm: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm("")}
                  className="ml-1.5 font-black text-sm"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Tìm kiếm
            </label>
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Mã đơn, tên, SĐT, địa chỉ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Trạng thái đơn
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="shipping">Đang giao hàng</option>
              <option value="received">Đã giao thành công</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Phương thức thanh toán
            </label>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
            >
              <option value="all">Tất cả phương thức</option>
              <option value="bank">Bank Transfer (Ngân hàng / VNPay)</option>
              <option value="cod">COD (Tiền mặt)</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setFilterPayment("all");
              }}
              className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex-1"
            >
              Đặt lại
            </button>
            <button
              onClick={fetchOrdersAndAccounts}
              className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-blue-500/20 flex-1 flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Làm mới</span>
            </button>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-200/80">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl text-slate-400">
            📦
          </div>
          <p className="text-base font-bold text-slate-800">Không tìm thấy đơn hàng nào</p>
          <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cột Bank Transfer */}
          <div className="space-y-4">
            <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-200/80 sticky top-0 z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-lg text-blue-600">
                  💳
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Bank Transfer & VNPay</h3>
                  <p className="text-[11px] text-slate-400">Chuyển khoản trực tuyến</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100">
                  {bankOrders.length} đơn
                </span>
              </div>
            </div>

            {bankOrders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-200/80">
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-slate-50 flex items-center justify-center text-2xl text-slate-300">
                  💳
                </div>
                <p className="text-xs font-semibold text-slate-400">Không có đơn hàng chuyển khoản</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {visibleBankOrders.map((order) => {
                    const paymentStatus = getPaymentStatus(order);
                    return (
                      <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2.5 pb-2.5 border-b border-slate-100">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-slate-900">#{order.id}</span>
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                  {order.payment_method === 'vnpay' 
                                    ? (getBankCode(order) ? `VNPay - ${getBankCode(order)}` : 'VNPay') 
                                    : (getBankCode(order) ? `Bank - ${getBankCode(order)}` : 'Bank')}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">{formatDateTime(order.created_at)}</div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                              </span>
                              <span className={`text-[10px] font-bold ${paymentStatus.color}`}>
                                {paymentStatus.text}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mb-3 space-y-0.5">
                            <div className="text-xs font-bold text-slate-800">{order.name}</div>
                            <div className="text-xs text-slate-500 font-medium">{order.phone}</div>
                            <div className="text-[11px] text-slate-400 line-clamp-1">{order.address}</div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                          <div className="text-base font-black text-slate-900">
                            {Number(order.total_amount).toLocaleString()} ₫
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openDetailModal(order)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95"
                            >
                              Chi tiết
                            </button>
                            <button
                              onClick={() => openUpdateModal(order)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm shadow-blue-500/20 active:scale-95"
                            >
                              Cập nhật
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/70 px-2.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Nút xem thêm/thu gọn Bank */}
                {bankOrders.length > 5 && (
                  <div className="flex justify-center gap-2 pt-2">
                    {visibleCountBank < bankOrders.length && (
                      <button
                        onClick={() => setVisibleCountBank(prev => prev + 5)}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl transition text-xs font-bold active:scale-95 shadow-sm"
                      >
                        + Xem thêm 5 đơn
                      </button>
                    )}
                    {visibleCountBank > 5 && (
                      <button
                        onClick={() => setVisibleCountBank(5)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition text-xs font-bold active:scale-95"
                      >
                        Thu gọn
                      </button>
                    )}
                  </div>
                )}
                <p className="text-center text-[11px] text-slate-400">
                  Hiển thị {visibleBankOrders.length} / {bankOrders.length} đơn hàng Bank
                </p>
              </>
            )}
          </div>

          {/* Cột COD */}
          <div className="space-y-4">
            <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-200/80 sticky top-0 z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-lg text-emerald-600">
                  💵
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">COD (Tiền mặt)</h3>
                  <p className="text-[11px] text-slate-400">Thanh toán khi nhận hàng</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                  {codOrders.length} đơn
                </span>
              </div>
            </div>

            {codOrders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-200/80">
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-slate-50 flex items-center justify-center text-2xl text-slate-300">
                  💵
                </div>
                <p className="text-xs font-semibold text-slate-400">Không có đơn hàng COD</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {visibleCODOrders.map((order) => {
                    const paymentStatus = getPaymentStatus(order);
                    return (
                      <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2.5 pb-2.5 border-b border-slate-100">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-slate-900">#{order.id}</span>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                  COD
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">{formatDateTime(order.created_at)}</div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                              </span>
                              <span className={`text-[10px] font-bold ${paymentStatus.color}`}>
                                {paymentStatus.text}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mb-3 space-y-0.5">
                            <div className="text-xs font-bold text-slate-800">{order.name}</div>
                            <div className="text-xs text-slate-500 font-medium">{order.phone}</div>
                            <div className="text-[11px] text-slate-400 line-clamp-1">{order.address}</div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                          <div className="text-base font-black text-slate-900">
                            {Number(order.total_amount).toLocaleString()} ₫
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openDetailModal(order)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95"
                            >
                              Chi tiết
                            </button>
                            <button
                              onClick={() => openUpdateModal(order)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm shadow-emerald-500/20 active:scale-95"
                            >
                              Cập nhật
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/70 px-2.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Nút xem thêm/thu gọn COD */}
                {codOrders.length > 5 && (
                  <div className="flex justify-center gap-2 pt-2">
                    {visibleCountCOD < codOrders.length && (
                      <button
                        onClick={() => setVisibleCountCOD(prev => prev + 5)}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl transition text-xs font-bold active:scale-95 shadow-sm"
                      >
                        + Xem thêm 5 đơn
                      </button>
                    )}
                    {visibleCountCOD > 5 && (
                      <button
                        onClick={() => setVisibleCountCOD(5)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition text-xs font-bold active:scale-95"
                      >
                        Thu gọn
                      </button>
                    )}
                  </div>
                )}
                <p className="text-center text-[11px] text-slate-400">
                  Hiển thị {visibleCODOrders.length} / {codOrders.length} đơn hàng COD
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal cập nhật trạng thái */}
      {updateModal.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900">Cập Nhật Trạng Thái</h3>
              <button
                onClick={closeUpdateModal}
                className="text-slate-400 hover:text-slate-600 transition p-1 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {updateModal.order && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-500">Mã đơn:</span>
                    <span className="font-black text-slate-900">#{updateModal.order.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-500">Khách hàng:</span>
                    <span className="font-bold text-slate-800">{updateModal.order.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-500">Tổng tiền:</span>
                    <span className="font-black text-blue-600">{Number(updateModal.order.total_amount).toLocaleString()} ₫</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-500">Thanh toán:</span>
                    <span className="font-bold text-slate-700">
                      {updateModal.order.payment_method === 'cod' 
                        ? 'COD' 
                        : getBankCode(updateModal.order) 
                          ? `Bank (${getBankCode(updateModal.order)})` 
                          : 'Bank'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="font-bold text-slate-500">Hiện tại:</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${getStatusColor(updateModal.order.status)}`}>
                      {getStatusText(updateModal.order.status)}
                    </span>
                  </div>
                  {updateModal.order.payment_method === 'cod' && updateModal.newStatus === 'received' && (
                    <p className="text-[11px] text-emerald-600 font-bold mt-2 pt-1 border-t border-slate-200">
                      ✓ Đơn COD sẽ tự động chuyển thành "Đã thanh toán" khi chọn "Đã giao thành công"
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Chọn trạng thái chuyển đổi:
                  </label>
                  <select
                    value={updateModal.newStatus}
                    onChange={(e) => setUpdateModal(prev => ({ ...prev, newStatus: e.target.value }))}
                    className="w-full h-11 px-3.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                  >
                    <option value="pending">Chờ xác nhận</option>
                    <option value="confirmed">Đã xác nhận</option>
                    <option value="shipping">Đang giao hàng</option>
                    <option value="received">Đã giao thành công</option>
                  </select>
                </div>

                <div className="flex gap-2.5 justify-end pt-2">
                  <button
                    onClick={closeUpdateModal}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 font-bold text-xs transition border border-slate-200 rounded-xl"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleUpdateStatus}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-blue-500/20 active:scale-95"
                  >
                    Xác nhận lưu
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal chi tiết đơn hàng */}
      {detailModal.show && detailModal.order && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-5 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] overflow-hidden flex flex-col border border-slate-100">
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-900">Chi tiết đơn hàng #{detailModal.order.id}</h3>
                <p className="text-xs text-slate-400">Thời gian: {formatDateTime(detailModal.order.created_at)}</p>
              </div>
              <button
                onClick={closeDetailModal}
                className="text-slate-400 hover:text-slate-700 transition p-1 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Thông tin đơn hàng & Khách hàng */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span>📋</span>
                    <span>Thông tin giao dịch</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Mã đơn:</span>
                      <span className="font-black text-slate-900">#{detailModal.order.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Trạng thái đơn:</span>
                      <span className={`px-2 py-0.5 rounded-lg font-bold text-[10px] ${getStatusColor(detailModal.order.status)}`}>
                        {getStatusText(detailModal.order.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Phương thức:</span>
                      <span className="font-bold text-slate-800">
                        {detailModal.order.payment_method === 'cod' 
                          ? 'COD (Tiền mặt)' 
                          : detailModal.order.payment_method === 'vnpay'
                          ? 'VNPay'
                          : 'Chuyển khoản'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Thanh toán:</span>
                      <span className={`font-bold ${getPaymentStatus(detailModal.order).color}`}>
                        {getPaymentStatus(detailModal.order).text}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Tài khoản:</span>
                      <span className="font-bold text-slate-800">{getUsername(detailModal.order.account_id)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                  <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span>👤</span>
                    <span>Thông tin người nhận</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Họ tên:</span>
                      <p className="font-black text-slate-900 text-sm mt-0.5">{detailModal.order.name}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Số điện thoại:</span>
                      <p className="font-bold text-slate-800 mt-0.5">{detailModal.order.phone}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Địa chỉ giao:</span>
                      <p className="font-semibold text-slate-700 mt-0.5">{detailModal.order.address}</p>
                    </div>
                    {detailModal.order.note && (
                      <div>
                        <span className="text-slate-400 font-medium">Ghi chú:</span>
                        <p className="font-medium text-slate-600 italic mt-0.5">{detailModal.order.note}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Danh sách sản phẩm */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Sản phẩm đã đặt ({detailModal.order.order_details?.length || 0})
                </h4>
                
                {detailModal.order.order_details && detailModal.order.order_details.length > 0 ? (
                  <div className="space-y-2.5">
                    {detailModal.order.order_details.map((detail, index) => (
                      <div 
                        key={index} 
                        onClick={() => navigate(`/product/${detail.product_id}`)}
                        className="bg-slate-50 hover:bg-slate-100/80 rounded-2xl p-3.5 flex items-center gap-4 transition cursor-pointer border border-slate-100"
                      >
                        <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 overflow-hidden flex-shrink-0">
                          <img 
                            src={resolveImage(detail.image)} 
                            alt={detail.product_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/placeholder.png';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{detail.product_name}</h5>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-bold text-[11px]">
                              Size {detail.size_name}
                            </span>
                            <span className="font-bold">
                              SL: <span className="text-slate-900 font-black">{detail.quantity}</span>
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-semibold text-slate-400">
                            {Number(detail.price).toLocaleString()} ₫
                          </div>
                          <div className="text-sm font-black text-slate-900 mt-0.5">
                            {(Number(detail.price) * detail.quantity).toLocaleString()} ₫
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400 italic bg-slate-50 rounded-2xl">
                    Không có thông tin chi tiết sản phẩm
                  </div>
                )}
              </div>

              {/* Tổng tiền */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl flex justify-between items-center shadow-lg">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng giá trị đơn hàng</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Gồm {detailModal.order.order_details?.reduce((sum, item) => sum + item.quantity, 0) || 0} sản phẩm
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-white">
                    {Number(detailModal.order.total_amount).toLocaleString()} ₫
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                    ✓ Đã áp dụng giảm giá & voucher
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5 shrink-0">
              <button
                onClick={closeDetailModal}
                className="px-5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 rounded-xl transition"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  closeDetailModal();
                  openUpdateModal(detailModal.order);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-blue-500/20 active:scale-95"
              >
                Cập nhật trạng thái
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}