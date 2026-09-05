// src/view/User/OrderManager.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAllOrders, deleteOrder } from "../../api";
import Session from "../../Session/session";

export default function OrderManager({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(8);

  const user = Session.getUser();
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllOrders();
      const userOrders = data.filter((order) => order.account_id === user.id);
      const sortedOrders = userOrders.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setOrders(sortedOrders);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Lỗi khi tải danh sách đơn hàng");
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  const displayedOrders = useMemo(() => {
    return filteredOrders.slice(0, visibleCount);
  }, [filteredOrders, visibleCount]);

  const handleShowDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedOrder(null);
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng #" + orderId + "? Hành động này không thể hoàn tác.")) {
      return;
    }

    try {
      await deleteOrder(orderId);
      alert("Hủy đơn hàng thành công!");
      if (showDetailModal) handleCloseDetail();
      fetchOrders();
    } catch (err) {
      alert("Lỗi khi hủy đơn hàng: " + (err.message || "Vui lòng thử lại!"));
      console.error("Lỗi:", err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return {
          text: "Chờ xác nhận",
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          dot: "bg-amber-500 animate-pulse",
        };
      case "confirmed":
        return {
          text: "Đã xác nhận",
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          dot: "bg-blue-500",
        };
      case "shipping":
        return {
          text: "Đang giao hàng",
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
          dot: "bg-indigo-500 animate-bounce",
        };
      case "received":
        return {
          text: "Giao thành công",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: "bg-emerald-500",
        };
      case "cancelled":
        return {
          text: "Đã hủy đơn",
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          dot: "bg-rose-500",
        };
      default:
        return {
          text: status,
          bg: "bg-slate-50 text-slate-700 border-slate-200",
          dot: "bg-slate-400",
        };
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getPaymentStatus = (order) => {
    if (order.payment_method === "cod") {
      if (order.status === "received") {
        return { text: "Đã thanh toán (COD)", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
      }
      return { text: "Chưa thanh toán (Thu COD)", color: "text-amber-700 bg-amber-50 border-amber-200" };
    }
    if (order.payment_method === "vnpay" || order.payment_method === "bank" || order.is_paid) {
      return { text: "Đã thanh toán online", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    }
    return { text: "Chưa thanh toán", color: "text-rose-700 bg-rose-50 border-rose-200" };
  };

  const getPaymentMethodText = (order) => {
    if (order.payment_method === "cod") return "💵 COD (Tiền mặt)";
    if (order.payment_method === "vnpay") return "💳 VNPay";
    if (order.payment_method === "bank") return "🏦 Chuyển khoản";
    return order.payment_method || "N/A";
  };

  const resolveImage = (img) => {
    if (!img) return "/images/placeholder.png";
    const trimmed = String(img).trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    if (trimmed.startsWith("/")) return encodeURI(trimmed);
    return `/images/${encodeURI(trimmed)}`;
  };

  // Status counts
  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    shipping: orders.filter((o) => o.status === "shipping").length,
    received: orders.filter((o) => o.status === "received").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Đang tải lịch sử đơn hàng của bạn...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filter Tabs */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>🛍️</span>
              <span>Đơn Hàng Của Tôi</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Theo dõi và kiểm tra tình trạng xử lý các đơn hàng bạn đã mua sắm tại CoolShop.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80">
            <span>Tổng cộng:</span>
            <span className="text-blue-600 font-extrabold text-sm">{orders.length}</span>
            <span>đơn hàng</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
          {[
            { id: "all", label: "Tất cả", count: counts.all },
            { id: "pending", label: "Chờ xác nhận", count: counts.pending },
            { id: "shipping", label: "Đang vận chuyển", count: counts.shipping },
            { id: "received", label: "Giao thành công", count: counts.received },
            { id: "cancelled", label: "Đã hủy", count: counts.cancelled },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setVisibleCount(8);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
                  active
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Empty orders */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-4">
          <div className="w-16 h-16 mx-auto bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-3xl">
            📦
          </div>
          <h3 className="text-lg font-bold text-slate-900">Không tìm thấy đơn hàng nào</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {statusFilter === "all"
              ? "Bạn chưa có giao dịch đặt hàng nào tại CoolShop. Hãy chọn cho mình những bộ đồ thể thao ưng ý!"
              : "Không có đơn hàng nào trong trạng thái này."}
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-sm shadow-md hover:scale-105 transition"
          >
            Khám phá sản phẩm ngay ⚡
          </button>
        </div>
      ) : (
        <>
          {/* Order Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {displayedOrders.map((order) => {
              const statusBadge = getStatusBadge(order.status);
              const paymentStatus = getPaymentStatus(order);
              const itemCount = order.order_details?.reduce((sum, i) => sum + i.quantity, 0) || 0;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-4 relative group"
                >
                  {/* Top: Order Id & Status */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900 text-base">
                        #{order.id}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">
                        {formatDateTime(order.created_at)}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.bg}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`}></span>
                      <span>{statusBadge.text}</span>
                    </span>
                  </div>

                  {/* Middle: Order summary info */}
                  <div className="space-y-2.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Người nhận:</span>
                      <span className="font-bold text-slate-900">{order.name} ({order.phone})</span>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <span className="text-slate-500 flex-shrink-0">Giao đến:</span>
                      <span className="font-medium text-slate-700 text-right truncate max-w-[220px]" title={order.address}>
                        {order.address}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Hình thức:</span>
                      <span className="font-semibold text-slate-800">{getPaymentMethodText(order)}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-500">Thanh toán:</span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${paymentStatus.color}`}>
                        {paymentStatus.text}
                      </span>
                    </div>
                  </div>

                  {/* Pricing and Action row */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">
                        Tổng tiền ({itemCount} món):
                      </span>
                      <span className="text-lg font-black text-blue-600">
                        {Number(order.total_amount).toLocaleString("vi-VN")} ₫
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.status === "pending" && (
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                        >
                          Hủy đơn
                        </button>
                      )}
                      <button
                        onClick={() => handleShowDetail(order)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-blue-600 text-white shadow-md transition"
                      >
                        Chi tiết đơn →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More buttons */}
          <div className="flex justify-center items-center gap-3 pt-4">
            {visibleCount < filteredOrders.length && (
              <button
                onClick={() => setVisibleCount((prev) => prev + 8)}
                className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-50 shadow-sm transition"
              >
                Xem thêm {filteredOrders.length - visibleCount} đơn hàng nữa ↓
              </button>
            )}
            {visibleCount > 8 && (
              <button
                onClick={() => setVisibleCount(8)}
                className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition"
              >
                Thu gọn ↑
              </button>
            )}
          </div>
        </>
      )}

      {/* Modal Chi Tiết Đơn Hàng Sang Trọng (Canh giữa chuẩn mực) */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-black text-slate-900">
                    Chi Tiết Đơn Hàng #{selectedOrder.id}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                      getStatusBadge(selectedOrder.status).bg
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${getStatusBadge(selectedOrder.status).dot}`}></span>
                    <span>{getStatusBadge(selectedOrder.status).text}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Thời gian đặt hàng: {formatDateTime(selectedOrder.created_at)}
                </p>
              </div>

              <button
                onClick={handleCloseDetail}
                className="w-9 h-9 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition"
                title="Đóng modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Receiver and Payment Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <span>📍</span>
                    <span>Thông tin giao nhận</span>
                  </h4>
                  <p className="text-sm font-extrabold text-slate-900">{selectedOrder.name}</p>
                  <p className="text-xs text-slate-600 font-medium">Số điện thoại: {selectedOrder.phone}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Địa chỉ: <span className="font-semibold text-slate-800">{selectedOrder.address}</span>
                  </p>
                  {selectedOrder.note && (
                    <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg mt-1 italic">
                      Ghi chú: {selectedOrder.note}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <span>💳</span>
                    <span>Phương thức thanh toán</span>
                  </h4>
                  <p className="text-sm font-extrabold text-slate-900">
                    {getPaymentMethodText(selectedOrder)}
                  </p>
                  <div className="pt-1">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        getPaymentStatus(selectedOrder).color
                      }`}
                    >
                      {getPaymentStatus(selectedOrder).text}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Mã đơn hàng nội bộ: <span className="font-mono text-slate-600">#{selectedOrder.id}</span>
                  </p>
                </div>
              </div>

              {/* Products List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Danh sách sản phẩm</span>
                  <span>{selectedOrder.order_details?.length || 0} mục</span>
                </h4>

                <div className="space-y-2.5">
                  {selectedOrder.order_details && selectedOrder.order_details.length > 0 ? (
                    selectedOrder.order_details.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          handleCloseDetail();
                          navigate(`/product/${item.product_id}`);
                        }}
                        className="p-3 rounded-2xl border border-slate-200/70 hover:border-blue-400 bg-white hover:bg-blue-50/30 transition flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={resolveImage(item.image)}
                            alt={item.product_name}
                            className="w-14 h-14 object-cover rounded-xl border border-slate-100 bg-slate-100 flex-shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/images/placeholder.png";
                            }}
                          />
                          <div>
                            <h5 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                              {item.product_name}
                            </h5>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                              <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                                Size: {item.size_name || "Free"}
                              </span>
                              <span>x {item.quantity}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-slate-900">
                            {(Number(item.price) * item.quantity).toLocaleString("vi-VN")} ₫
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {Number(item.price).toLocaleString("vi-VN")} ₫ / sp
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 text-slate-400 text-xs text-center">
                      Không có thông tin chi tiết sản phẩm.
                    </div>
                  )}
                </div>
              </div>

              {/* Order Total Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shadow-lg">
                <div>
                  <span className="text-xs text-blue-300 font-bold uppercase tracking-wider block">
                    Tổng tiền thanh toán
                  </span>
                  <span className="text-xs text-slate-400">Đã bao gồm thuế và phí giao hàng</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-white">
                    {Number(selectedOrder.total_amount).toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
              {selectedOrder.status === "pending" ? (
                <button
                  onClick={() => handleDeleteOrder(selectedOrder.id)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                >
                  Hủy đơn hàng này
                </button>
              ) : (
                <div className="text-xs text-slate-400 italic">
                  Đơn hàng đã qua bước chờ duyệt
                </div>
              )}

              <button
                onClick={handleCloseDetail}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}