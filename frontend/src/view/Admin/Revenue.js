// src/view/Admin/Revenue.js
import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { getAllOrders, getAllProducts } from "../../api";
import { RevenueTabContentSkeleton } from "../common/Skeletons";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function getCurrentWeek() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

function getWeekFromDate(date) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

function getDatesOfWeek(weekNumber, year = new Date().getFullYear()) {
  const firstDayOfYear = new Date(year, 0, 1);
  const daysOffset = firstDayOfYear.getDay() === 0 ? 1 : 8 - firstDayOfYear.getDay();

  const firstMonday = new Date(year, 0, 1 + daysOffset);
  const startDate = new Date(firstMonday);
  startDate.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }
  return dates;
}

export default function Revenue() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("revenue");
  const [revenueData, setRevenueData] = useState({
    weeklyRevenue: 0,
    dailyRevenue: {},
    totalOrders: 0,
    averageOrderValue: 0,
    pendingOrders: [],
    pendingRevenue: 0,
    paidOrders: [],
    paidRevenue: 0,
    totalWeeklyOrders: 0
  });

  // State cho lazy loading
  const [pendingVisibleCount, setPendingVisibleCount] = useState(5);
  const [confirmedVisibleCount, setConfirmedVisibleCount] = useState(5);
  const [shippingVisibleCount, setShippingVisibleCount] = useState(5);
  const [paidVisibleCount, setPaidVisibleCount] = useState(5);

  // State cho modal chi tiết ngày
  const [dayDetailModal, setDayDetailModal] = useState({ show: false, date: null, orders: [] });

  // Hàm lấy thông tin ngân hàng từ payment_info
  const getBankCode = (order) => {
    if (order.payment_method !== 'bank' || !order.payment_info) {
      return null;
    }
    try {
      const paymentInfo = JSON.parse(order.payment_info);
      return paymentInfo.vnpay_bank_code || null;
    } catch (error) {
      console.error('Error parsing payment_info:', error);
      return null;
    }
  };

  // Hàm tính doanh thu và thống kê
  const calculateRevenueAndStats = useCallback((orders, week) => {
    const weekDates = getDatesOfWeek(week);
    const startDate = weekDates[0];
    const endDate = weekDates[6];
    endDate.setHours(23, 59, 59, 999);

    // Lọc đơn hàng trong tuần
    const weeklyOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at || order.order_date);
      return orderDate >= startDate && orderDate <= endDate;
    });

    // Đơn hàng chờ xác nhận - Sắp xếp mới nhất lên đầu
    const pendingOrders = weeklyOrders
      .filter(order => order.status === 'pending')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Đơn hàng đã xác nhận - Sắp xếp mới nhất lên đầu
    const confirmedOrders = weeklyOrders
      .filter(order => order.status === 'confirmed')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Đơn hàng đang giao hàng - Sắp xếp mới nhất lên đầu
    const shippingOrders = weeklyOrders
      .filter(order => order.status === 'shipping')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Đơn hàng đã thanh toán - Sắp xếp mới nhất lên đầu
    // - VNPay: Tự động (thanh toán online ngay)
    // - Bank: Chỉ khi is_paid = 1 (đã xác nhận chuyển khoản)
    // - COD: Chỉ khi đã giao thành công (received)
    const paidOrders = weeklyOrders
      .filter(order => 
        order.payment_method === 'vnpay' || 
        (order.payment_method === 'bank' && order.is_paid) || 
        (order.payment_method === 'cod' && order.status === 'received')
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Đơn hàng đã nhận = Chỉ tính các đơn đã thanh toán cho doanh thu
    const receivedOrders = paidOrders;

    // Tính doanh thu theo ngày (tất cả đơn hàng)
    const dailyRevenue = {};
    weekDates.forEach(date => {
      const dateKey = date.toISOString().split('T')[0];
      dailyRevenue[dateKey] = 0;
    });

    let totalRevenue = 0;
    receivedOrders.forEach(order => {
      const orderDate = new Date(order.created_at || order.order_date);
      const dateKey = orderDate.toISOString().split('T')[0];
      const orderTotal = parseFloat(order.total_amount) || 0;
      
      dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + orderTotal;
      totalRevenue += orderTotal;
    });

    // Tính tổng giá trị đơn hàng chờ xác nhận
    const pendingRevenue = pendingOrders.reduce((sum, order) => 
      sum + (parseFloat(order.total_amount) || 0), 0
    );

    // Tính tổng giá trị đơn hàng đã xác nhận
    const confirmedRevenue = confirmedOrders.reduce((sum, order) => 
      sum + (parseFloat(order.total_amount) || 0), 0
    );

    // Tính tổng giá trị đơn hàng đang giao hàng
    const shippingRevenue = shippingOrders.reduce((sum, order) => 
      sum + (parseFloat(order.total_amount) || 0), 0
    );

    // Tính tổng giá trị đơn hàng đã thanh toán
    const paidRevenue = paidOrders.reduce((sum, order) => 
      sum + (parseFloat(order.total_amount) || 0), 0
    );

    return {
      // Doanh thu
      weeklyRevenue: totalRevenue,
      dailyRevenue,
      totalOrders: pendingOrders.length + paidOrders.length, // Tổng = Chờ xác nhận + Đã thanh toán
      averageOrderValue: receivedOrders.length > 0 ? totalRevenue / receivedOrders.length : 0,
      
      // Thống kê
      pendingOrders: pendingOrders, // Mảng đơn hàng
      pendingOrdersCount: pendingOrders.length, // Số lượng
      pendingRevenue: pendingRevenue,
      
      confirmedOrders: confirmedOrders,
      confirmedOrdersCount: confirmedOrders.length,
      confirmedRevenue: confirmedRevenue,
      
      shippingOrders: shippingOrders,
      shippingOrdersCount: shippingOrders.length,
      shippingRevenue: shippingRevenue,
      
      paidOrders: paidOrders, // Mảng đơn hàng
      paidOrdersCount: paidOrders.length, // Số lượng
      paidRevenue: paidRevenue,
      totalWeeklyOrders: weeklyOrders.length,
      
      // Chi tiết đơn hàng
      allOrders: weeklyOrders,
      receivedOrders,
    };
  }, []);

  // Fetch orders và products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersData, productsData] = await Promise.all([
          getAllOrders(),
          getAllProducts()
        ]);
        setOrders(ordersData);
        setProducts(productsData);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Tính toán doanh thu và thống kê
  useEffect(() => {
    if (orders.length > 0) {
      const data = calculateRevenueAndStats(orders, selectedWeek);
      setRevenueData(data);
    }
  }, [orders, selectedWeek, calculateRevenueAndStats]);

  // Reset lazy loading khi chuyển tab hoặc tuần
  useEffect(() => {
    setPendingVisibleCount(5);
    setPaidVisibleCount(5);
  }, [activeTab, selectedWeek]);

  // Xử lý chọn ngày từ calendar
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const week = getWeekFromDate(date);
    setSelectedWeek(week);
    setShowCalendar(false);
  };

  // Chuyển tuần
  const navigateWeek = (direction) => {
    setSelectedWeek(prev => {
      const newWeek = direction === 'next' ? prev + 1 : prev - 1;
      return Math.max(1, newWeek);
    });
  };

  // Tạo calendar
  const renderCalendar = () => {
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    
    const daysInMonth = lastDayOfMonth.getDate();
    const today = new Date();

    const weeks = [];
    let days = [];

    // Thêm các ngày trống đầu tháng
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }

    // Thêm các ngày trong tháng
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = getWeekFromDate(date) === selectedWeek;
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(date)}
          className={`h-8 w-8 rounded-full text-sm font-medium transition-all ${
            isSelected 
              ? 'bg-blue-600 text-white' 
              : isToday
              ? 'bg-blue-100 text-blue-600'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          {day}
        </button>
      );

      if ((day + startingDayOfWeek) % 7 === 0 || day === daysInMonth) {
        weeks.push(
          <div key={`week-${weeks.length}`} className="grid grid-cols-7 gap-1">
            {days}
          </div>
        );
        days = [];
      }
    }

    return weeks;
  };

  // Chuyển tháng
  const navigateMonth = (direction) => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'next') {
        newDate.setMonth(newDate.getMonth() + 1);
      } else {
        newDate.setMonth(newDate.getMonth() - 1);
      }
      return newDate;
    });
  };

  // Lấy tên ngày trong tuần
  const getDayName = (date) => {
    return date.toLocaleDateString('vi-VN', { weekday: 'long' });
  };

  // Định dạng tiền
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Định dạng ngày
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  // Định dạng ngày giờ đầy đủ
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Mở modal chi tiết ngày
  const openDayDetailModal = (dateKey) => {
    const dayOrders = revenueData.paidOrders.filter(order => {
      const orderDate = new Date(order.created_at || order.order_date);
      const orderDateKey = orderDate.toISOString().split('T')[0];
      return orderDateKey === dateKey;
    });
    setDayDetailModal({ show: true, date: dateKey, orders: dayOrders });
  };

  const closeDayDetailModal = () => {
    setDayDetailModal({ show: false, date: null, orders: [] });
  };

  // Định dạng tháng
  const formatMonthYear = (date) => {
    return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  };

  // Lấy tên sản phẩm từ order details
  const getProductNames = (order) => {
    if (!order.order_details || order.order_details.length === 0) {
      return [];
    }
    
    return order.order_details.map(detail => {
      const product = products.find(p => p.id === detail.product_id);
      return product ? product.name : `Sản phẩm #${detail.product_id}`;
    });
  };

  // Lấy chi tiết sản phẩm (tên, size, số lượng)
  const getProductDetails = (order) => {
    if (!order.order_details || order.order_details.length === 0) {
      return [];
    }
    
    return order.order_details.map(detail => {
      const product = products.find(p => p.id === detail.product_id);
      return {
        name: product ? product.name : `Sản phẩm #${detail.product_id}`,
        size: detail.size_name || 'N/A',
        quantity: detail.quantity || 1,
        price: detail.price || 0
      };
    });
  };

  // Vẽ biểu đồ bằng Chart.js (Bar)
  const renderSimpleChart = () => {
    const weekDates = getDatesOfWeek(selectedWeek);
    const labels = weekDates.map(d => getDayName(d));
    const dataValues = weekDates.map(d => {
      const key = d.toISOString().split('T')[0];
      return Math.round((revenueData.dailyRevenue[key] || 0));
    });

    const data = {
      labels,
      datasets: [
        {
          label: 'Doanh thu (VND)',
          data: dataValues,
          backgroundColor: function(context) {
            const value = context.dataset.data[context.dataIndex];
            return value > 0 ? 'rgba(34,197,94,0.85)' : 'rgba(209,213,219,0.7)';
          },
          borderRadius: 6,
          barThickness: 28,
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed.y || 0;
              return ` ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)}`;
            }
          }
        },
        title: {
          display: false
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          ticks: {
            callback: (value) => {
              return value >= 1000 ? `${value.toLocaleString('vi-VN')}` : value;
            }
          },
          grid: { color: 'rgba(229,231,235,0.6)' }
        }
      }
    };

    return (
      <div style={{ height: 320, padding: '12px' }}>
        <Bar data={data} options={options} />
      </div>
    );
  };

  // Render đơn hàng chờ xác nhận - ĐÃ SỬA VỚI LAZY LOADING
  const renderPendingOrders = () => {
    const pendingOrders = revenueData.pendingOrders || [];
    const visibleOrders = pendingOrders.slice(0, pendingVisibleCount);
    const hasMore = pendingOrders.length > pendingVisibleCount;
    
    if (pendingOrders.length === 0) {
      return (
        <div className="text-center py-12 text-slate-400">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 text-2xl">
            ⏳
          </div>
          <p className="text-sm font-medium text-slate-600">Không có đơn hàng chờ xác nhận trong tuần này</p>
        </div>
      );
    }

    return (
      <div>
        {/* Grid hiển thị 5 sản phẩm trên 1 hàng */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          {visibleOrders.map(order => (
            <div key={order.id} className="border border-slate-200/80 bg-white hover:border-amber-400 hover:shadow-md transition-all rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="font-extrabold text-slate-900 text-sm truncate">#{order.id}</h4>
                    <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">{order.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{order.phone}</p>
                  </div>
                  <span className="bg-amber-50 text-amber-700 border border-amber-200/70 px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap">
                    Chờ duyệt
                  </span>
                </div>
                
                <div className="mb-3">
                  <div className="text-xs text-slate-600 space-y-1 max-h-20 overflow-y-auto pr-1">
                    {getProductNames(order).slice(0, 3).map((product, idx) => (
                      <div key={idx} className="flex items-start text-[11px]">
                        <span className="text-amber-500 mr-1.5 font-bold">•</span>
                        <span className="flex-1 line-clamp-1">{product}</span>
                      </div>
                    ))}
                    {getProductNames(order).length > 3 && (
                      <div className="text-[11px] text-amber-600 font-semibold pl-2.5">
                        +{getProductNames(order).length - 3} sản phẩm khác
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t border-slate-100">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">
                      {order.payment_method === 'cod' ? 'COD' : getBankCode(order) ? `Bank (${getBankCode(order)})` : 'Bank'}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {formatDateTime(order.created_at)}
                    </span>
                  </div>
                  <span className="text-sm font-black text-amber-600">
                    {formatCurrency(parseFloat(order.total_amount) || 0)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Nút điều khiển lazy loading */}
        <div className="flex justify-center space-x-3">
          {hasMore && (
            <button
              onClick={() => setPendingVisibleCount(prev => prev + 5)}
              className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl transition shadow-sm font-semibold text-xs flex items-center space-x-1.5"
            >
              <span>+ Xem thêm 5 đơn hàng</span>
            </button>
          )}
          
          {pendingVisibleCount > 5 && (
            <button
              onClick={() => setPendingVisibleCount(5)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-xl transition font-semibold text-xs flex items-center space-x-1.5"
            >
              <span>Thu gọn</span>
            </button>
          )}
        </div>

        {/* Hiển thị số lượng */}
        <div className="text-center mt-3 text-xs text-slate-400">
          Đang hiển thị {Math.min(visibleOrders.length, pendingVisibleCount)} / {pendingOrders.length} đơn hàng
        </div>
      </div>
    );
  };

  // Render đơn hàng đã thanh toán - ĐÃ SỬA VỚI LAZY LOADING
  const renderPaidOrders = () => {
    const paidOrders = revenueData.paidOrders || [];
    const visibleOrders = paidOrders.slice(0, paidVisibleCount);
    const hasMore = paidOrders.length > paidVisibleCount;
    
    if (paidOrders.length === 0) {
      return (
        <div className="text-center py-12 text-slate-400">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 text-2xl">
            💵
          </div>
          <p className="text-sm font-medium text-slate-600">Không có đơn hàng đã thanh toán trong tuần này</p>
        </div>
      );
    }

    return (
      <div>
        {/* Grid hiển thị 5 sản phẩm trên 1 hàng */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          {visibleOrders.map(order => (
            <div key={order.id} className="border border-slate-200/80 bg-white hover:border-emerald-400 hover:shadow-md transition-all rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="font-extrabold text-slate-900 text-sm truncate">#{order.id}</h4>
                    <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">{order.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{order.phone}</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/70 px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap">
                    Đã thanh toán
                  </span>
                </div>
                
                <div className="mb-3">
                  <div className="text-xs text-slate-600 space-y-1 max-h-20 overflow-y-auto pr-1">
                    {getProductNames(order).slice(0, 3).map((product, idx) => (
                      <div key={idx} className="flex items-start text-[11px]">
                        <span className="text-emerald-500 mr-1.5 font-bold">•</span>
                        <span className="flex-1 line-clamp-1">{product}</span>
                      </div>
                    ))}
                    {getProductNames(order).length > 3 && (
                      <div className="text-[11px] text-emerald-600 font-semibold pl-2.5">
                        +{getProductNames(order).length - 3} sản phẩm khác
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t border-slate-100">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">
                      {order.payment_method === 'cod' ? 'COD' : getBankCode(order) ? `Bank (${getBankCode(order)})` : 'Bank'}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {formatDateTime(order.created_at)}
                    </span>
                  </div>
                  <span className="text-sm font-black text-emerald-600">
                    {formatCurrency(parseFloat(order.total_amount) || 0)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Nút điều khiển lazy loading */}
        <div className="flex justify-center space-x-3">
          {hasMore && (
            <button
              onClick={() => setPaidVisibleCount(prev => prev + 5)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl transition shadow-sm font-semibold text-xs flex items-center space-x-1.5"
            >
              <span>+ Xem thêm 5 đơn hàng</span>
            </button>
          )}
          
          {paidVisibleCount > 5 && (
            <button
              onClick={() => setPaidVisibleCount(5)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-xl transition font-semibold text-xs flex items-center space-x-1.5"
            >
              <span>Thu gọn</span>
            </button>
          )}
        </div>

        {/* Hiển thị số lượng */}
        <div className="text-center mt-3 text-xs text-slate-400">
          Đang hiển thị {Math.min(visibleOrders.length, paidVisibleCount)} / {paidOrders.length} đơn hàng
        </div>
      </div>
    );
  };

  // Render đơn hàng đã xác nhận
  const renderConfirmedOrders = () => {
    const confirmedOrders = revenueData.confirmedOrders || [];
    const visibleOrders = confirmedOrders.slice(0, confirmedVisibleCount);
    const hasMore = confirmedOrders.length > confirmedVisibleCount;
    
    if (confirmedOrders.length === 0) {
      return (
        <div className="text-center py-12 text-slate-400">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 text-2xl">
            📋
          </div>
          <p className="text-sm font-medium text-slate-600">Không có đơn hàng đã xác nhận trong tuần này</p>
        </div>
      );
    }

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          {visibleOrders.map(order => (
            <div key={order.id} className="border border-slate-200/80 bg-white hover:border-blue-400 hover:shadow-md transition-all rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="font-extrabold text-slate-900 text-sm truncate">#{order.id}</h4>
                    <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">{order.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{order.phone}</p>
                  </div>
                  <span className="bg-blue-50 text-blue-700 border border-blue-200/70 px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap">
                    Đã xác nhận
                  </span>
                </div>
                
                <div className="mb-3">
                  <div className="text-xs text-slate-600 space-y-1 max-h-20 overflow-y-auto pr-1">
                    {getProductNames(order).slice(0, 3).map((product, idx) => (
                      <div key={idx} className="flex items-start text-[11px]">
                        <span className="text-blue-500 mr-1.5 font-bold">•</span>
                        <span className="flex-1 line-clamp-1">{product}</span>
                      </div>
                    ))}
                    {getProductNames(order).length > 3 && (
                      <div className="text-[11px] text-blue-600 font-semibold pl-2.5">
                        +{getProductNames(order).length - 3} sản phẩm khác
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t border-slate-100">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">
                      {order.payment_method === 'cod' ? 'COD' : getBankCode(order) ? `Bank (${getBankCode(order)})` : 'Bank'}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {formatDateTime(order.created_at)}
                    </span>
                  </div>
                  <span className="text-sm font-black text-blue-600">
                    {formatCurrency(parseFloat(order.total_amount) || 0)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center space-x-3">
          {hasMore && (
            <button
              onClick={() => setConfirmedVisibleCount(prev => prev + 5)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl transition shadow-sm font-semibold text-xs flex items-center space-x-1.5"
            >
              <span>+ Xem thêm 5 đơn hàng</span>
            </button>
          )}
          
          {confirmedVisibleCount > 5 && (
            <button
              onClick={() => setConfirmedVisibleCount(5)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-xl transition font-semibold text-xs flex items-center space-x-1.5"
            >
              <span>Thu gọn</span>
            </button>
          )}
        </div>

        <div className="text-center mt-3 text-xs text-slate-400">
          Đang hiển thị {Math.min(visibleOrders.length, confirmedVisibleCount)} / {confirmedOrders.length} đơn hàng
        </div>
      </div>
    );
  };

  // Render đơn hàng đang giao hàng
  const renderShippingOrders = () => {
    const shippingOrders = revenueData.shippingOrders || [];
    const visibleOrders = shippingOrders.slice(0, shippingVisibleCount);
    const hasMore = shippingOrders.length > shippingVisibleCount;
    
    if (shippingOrders.length === 0) {
      return (
        <div className="text-center py-12 text-slate-400">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-500 text-2xl">
            🚚
          </div>
          <p className="text-sm font-medium text-slate-600">Không có đơn hàng đang giao hàng trong tuần này</p>
        </div>
      );
    }

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          {visibleOrders.map(order => (
            <div key={order.id} className="border border-slate-200/80 bg-white hover:border-purple-400 hover:shadow-md transition-all rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="font-extrabold text-slate-900 text-sm truncate">#{order.id}</h4>
                    <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">{order.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{order.phone}</p>
                  </div>
                  <span className="bg-purple-50 text-purple-700 border border-purple-200/70 px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap">
                    Đang giao
                  </span>
                </div>
                
                <div className="mb-3">
                  <div className="text-xs text-slate-600 space-y-1 max-h-20 overflow-y-auto pr-1">
                    {getProductNames(order).slice(0, 3).map((product, idx) => (
                      <div key={idx} className="flex items-start text-[11px]">
                        <span className="text-purple-500 mr-1.5 font-bold">•</span>
                        <span className="flex-1 line-clamp-1">{product}</span>
                      </div>
                    ))}
                    {getProductNames(order).length > 3 && (
                      <div className="text-[11px] text-purple-600 font-semibold pl-2.5">
                        +{getProductNames(order).length - 3} sản phẩm khác
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t border-slate-100">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">
                      {order.payment_method === 'cod' ? 'COD' : getBankCode(order) ? `Bank (${getBankCode(order)})` : 'Bank'}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {formatDateTime(order.created_at)}
                    </span>
                  </div>
                  <span className="text-sm font-black text-purple-600">
                    {formatCurrency(parseFloat(order.total_amount) || 0)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center space-x-3">
          {hasMore && (
            <button
              onClick={() => setShippingVisibleCount(prev => prev + 5)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl transition shadow-sm font-semibold text-xs flex items-center space-x-1.5"
            >
              <span>+ Xem thêm 5 đơn hàng</span>
            </button>
          )}
          
          {shippingVisibleCount > 5 && (
            <button
              onClick={() => setShippingVisibleCount(5)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-xl transition font-semibold text-xs flex items-center space-x-1.5"
            >
              <span>Thu gọn</span>
            </button>
          )}
        </div>

        <div className="text-center mt-3 text-xs text-slate-400">
          Đang hiển thị {Math.min(visibleOrders.length, shippingVisibleCount)} / {shippingOrders.length} đơn hàng
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <RevenueTabContentSkeleton tab={activeTab} />
      </div>
    );
  }

  const weekDates = getDatesOfWeek(selectedWeek);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Week Selector với Calendar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Khoảng Thời Gian Báo Cáo</h2>
            <p className="text-xs text-slate-500">Xem doanh số và phân tích đơn hàng theo tuần</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Navigation Buttons */}
            <div className="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition shadow-sm"
                title="Tuần trước"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-lg transition shadow-md shadow-blue-500/20 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Tuần {selectedWeek} ({new Date().getFullYear()})</span>
              </button>

              <button
                onClick={() => navigateWeek('next')}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition shadow-sm"
                title="Tuần kế tiếp"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Hiển thị khoảng thời gian của tuần */}
        <div className="text-center text-xs sm:text-sm font-bold text-slate-700 bg-slate-50 py-2.5 px-4 rounded-xl border border-slate-100 flex items-center justify-center gap-2">
          <span>📅 Khoảng thời gian:</span>
          <span className="text-blue-600">{formatDate(weekDates[0].toISOString())}</span>
          <span>đến</span>
          <span className="text-blue-600">{formatDate(weekDates[6].toISOString())}</span>
        </div>

        {/* Calendar Popup */}
        {showCalendar && (
          <div className="absolute mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 w-80 top-20 right-4 animate-in fade-in">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h3 className="font-bold text-slate-800 text-sm">
                {formatMonthYear(selectedDate)}
              </h3>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                <div key={day} className="text-center text-[11px] font-bold text-slate-400 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="space-y-1">
              {renderCalendar()}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedDate(new Date());
                  setSelectedWeek(getCurrentWeek());
                  setShowCalendar(false);
                }}
                className="w-full bg-blue-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition"
              >
                Chọn tuần hiện tại
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("revenue")}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
              activeTab === "revenue" 
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25" 
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
            }`}
          >
            <span>📊</span>
            <span>Doanh thu</span>
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
              activeTab === "pending" 
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/25" 
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
            }`}
          >
            <span>⏳</span>
            <span>Chờ xác nhận</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${activeTab === "pending" ? "bg-amber-600 text-white" : "bg-slate-200 text-slate-700"}`}>
              {revenueData.pendingOrdersCount || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("confirmed")}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
              activeTab === "confirmed" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/25" 
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
            }`}
          >
            <span>✅</span>
            <span>Đã xác nhận</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${activeTab === "confirmed" ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-700"}`}>
              {revenueData.confirmedOrdersCount || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("shipping")}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
              activeTab === "shipping" 
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/25" 
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
            }`}
          >
            <span>🚚</span>
            <span>Đang giao</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${activeTab === "shipping" ? "bg-purple-700 text-white" : "bg-slate-200 text-slate-700"}`}>
              {revenueData.shippingOrdersCount || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("paid")}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 ${
              activeTab === "paid" 
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25" 
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
            }`}
          >
            <span>💵</span>
            <span>Đã thanh toán</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${activeTab === "paid" ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-700"}`}>
              {revenueData.paidOrdersCount || 0}
            </span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "revenue" && (
        <>
          {/* Revenue Summary 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Metric 1 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 hover:border-emerald-300 hover:shadow-md transition">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xl shadow-md shadow-emerald-500/25 flex-shrink-0">
                  💵
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Doanh thu tuần</p>
                  <p className="text-lg sm:text-2xl font-black text-slate-900 leading-tight truncate">
                    {formatCurrency(revenueData.weeklyRevenue)}
                  </p>
                </div>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 hover:border-blue-300 hover:shadow-md transition">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-blue-500/25 flex-shrink-0">
                  📦
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đơn hàng đã nhận</p>
                  <p className="text-lg sm:text-2xl font-black text-slate-900 leading-tight truncate">
                    {revenueData.totalOrders} đơn
                  </p>
                </div>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 hover:border-purple-300 hover:shadow-md transition">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-600 text-white flex items-center justify-center text-xl shadow-md shadow-purple-500/25 flex-shrink-0">
                  📈
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Giá trị trung bình</p>
                  <p className="text-lg sm:text-2xl font-black text-slate-900 leading-tight truncate">
                    {formatCurrency(revenueData.averageOrderValue)}
                  </p>
                </div>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 hover:border-amber-300 hover:shadow-md transition">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center text-xl shadow-md shadow-amber-500/25 flex-shrink-0">
                  📅
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tuần hoạt động</p>
                  <p className="text-lg sm:text-2xl font-black text-slate-900 leading-tight truncate">
                    #{selectedWeek}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Biểu đồ doanh thu */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Biểu đồ doanh thu tuần #{selectedWeek}
            </h3>
            <div className="border border-slate-100 rounded-xl bg-slate-50/50">
              {renderSimpleChart()}
            </div>
          </div>

          {/* Daily Revenue Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Doanh thu theo ngày trong tuần</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3">
              {weekDates.map((date, index) => {
                const dateKey = date.toISOString().split('T')[0];
                const revenue = revenueData.dailyRevenue[dateKey] || 0;
                const dayName = getDayName(date);
                
                return (
                  <div 
                    key={index} 
                    className={`text-center p-3.5 rounded-xl border transition-all ${
                      revenue > 0 
                        ? 'bg-emerald-50/40 border-emerald-200/80 cursor-pointer hover:shadow-md hover:border-emerald-400 hover:scale-[1.02]' 
                        : 'bg-slate-50/60 border-slate-100 text-slate-400'
                    }`}
                    onClick={() => revenue > 0 && openDayDetailModal(dateKey)}
                  >
                    <p className={`font-bold text-xs ${revenue > 0 ? 'text-slate-900' : 'text-slate-500'}`}>{dayName}</p>
                    <p className="text-[11px] text-slate-400 mb-1.5">{formatDate(dateKey)}</p>
                    <p className={`text-sm font-black ${
                      revenue > 0 ? 'text-emerald-600' : 'text-slate-300'
                    }`}>
                      {formatCurrency(revenue)}
                    </p>
                    {revenue > 0 && (
                      <span className="inline-block mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                        👁 Xem đơn
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {activeTab === "pending" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Đơn hàng chờ xác nhận — Tuần #{selectedWeek}
              </h3>
              <p className="text-xs text-slate-500">Các đơn hàng mới chưa được duyệt</p>
            </div>
            <div className="sm:text-right">
              <p className="text-2xl font-black text-amber-600">
                {formatCurrency(revenueData.pendingRevenue || 0)}
              </p>
              <p className="text-xs font-bold text-slate-400">
                {revenueData.pendingOrdersCount || 0} đơn hàng
              </p>
            </div>
          </div>
          {renderPendingOrders()}
        </div>
      )}

      {activeTab === "paid" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Đơn hàng đã thanh toán — Tuần #{selectedWeek}
              </h3>
              <p className="text-xs text-slate-500">Giao dịch đã hoàn tất thanh toán thành công</p>
            </div>
            <div className="sm:text-right">
              <p className="text-2xl font-black text-emerald-600">
                {formatCurrency(revenueData.paidRevenue || 0)}
              </p>
              <p className="text-xs font-bold text-slate-400">
                {revenueData.paidOrdersCount || 0} đơn hàng
              </p>
            </div>
          </div>
          {renderPaidOrders()}
        </div>
      )}

      {activeTab === "confirmed" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Đơn hàng đã xác nhận — Tuần #{selectedWeek}
              </h3>
              <p className="text-xs text-slate-500">Đơn hàng đã được duyệt và chuẩn bị đóng gói</p>
            </div>
            <div className="sm:text-right">
              <p className="text-2xl font-black text-blue-600">
                {formatCurrency(revenueData.confirmedRevenue || 0)}
              </p>
              <p className="text-xs font-bold text-slate-400">
                {revenueData.confirmedOrdersCount || 0} đơn hàng
              </p>
            </div>
          </div>
          {renderConfirmedOrders()}
        </div>
      )}

      {activeTab === "shipping" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Đơn hàng đang giao hàng — Tuần #{selectedWeek}
              </h3>
              <p className="text-xs text-slate-500">Đơn hàng đang trên đường vận chuyển tới khách hàng</p>
            </div>
            <div className="sm:text-right">
              <p className="text-2xl font-black text-purple-600">
                {formatCurrency(revenueData.shippingRevenue || 0)}
              </p>
              <p className="text-xs font-bold text-slate-400">
                {revenueData.shippingOrdersCount || 0} đơn hàng
              </p>
            </div>
          </div>
          {renderShippingOrders()}
        </div>
      )}

      {/* Modal chi tiết đơn hàng theo ngày */}
      {dayDetailModal.show && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-2 sm:p-4 md:p-6">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[92vh] md:h-[88vh] max-h-[920px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4 md:p-6 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl md:text-2xl font-bold">Chi tiết đơn hàng đã thanh toán</h3>
                <p className="text-green-100 mt-1 text-sm md:text-base">
                  Ngày: {formatDate(dayDetailModal.date)} - Tổng: {dayDetailModal.orders.length} đơn hàng
                </p>
              </div>
              <button
                onClick={closeDayDetailModal}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-3 md:p-6 overflow-y-auto flex-1 min-h-0">
              {dayDetailModal.orders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-lg">Không có đơn hàng nào trong ngày này</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dayDetailModal.orders.map((order, idx) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-white to-green-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 break-words">#{order.id} - {order.name}</h4>
                          <p className="text-sm text-gray-600">SĐT: {order.phone}</p>
                          <p className="text-xs text-gray-500">Địa chỉ: {order.address}</p>
                          <p className="text-xs text-gray-500">{formatDateTime(order.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            order.payment_method === 'vnpay' 
                              ? 'bg-purple-100 text-purple-800' 
                              : order.payment_method === 'cod'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {order.payment_method === 'cod' ? 'COD' : order.payment_method === 'vnpay' ? 'VNPay' : 'Bank'}
                          </span>
                          <p className="text-xl font-bold text-green-600 mt-2">
                            {formatCurrency(parseFloat(order.total_amount) || 0)}
                          </p>
                        </div>
                      </div>

                      {/* Sản phẩm */}
                      <div className="border-t border-gray-200 pt-3 mt-3">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Sản phẩm:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {getProductDetails(order).map((product, pIdx) => (
                            <div key={pIdx} className="flex items-start bg-white p-3 rounded border border-gray-100">
                              <span className="text-green-500 mr-2 mt-0.5">•</span>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800 break-words">{product.name}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                                  <span className="bg-gray-100 px-2 py-0.5 rounded">Size: {product.size}</span>
                                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">SL: {product.quantity}</span>
                                  <span className="text-green-600 font-semibold">{formatCurrency(product.price)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 md:px-6 py-3 md:py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between sm:items-center shrink-0">
              <div className="text-sm text-gray-600">
                Tổng doanh thu: <span className="font-bold text-green-600 text-lg">
                  {formatCurrency(dayDetailModal.orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0))}
                </span>
              </div>
              <button
                onClick={closeDayDetailModal}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}