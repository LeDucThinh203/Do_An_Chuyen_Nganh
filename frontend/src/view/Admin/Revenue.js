// src/view/Admin/Revenue.js
import React, { useState, useEffect } from "react";
import { getAllOrders, getAllProducts } from "../../api";

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
  const [paidVisibleCount, setPaidVisibleCount] = useState(5);

  // Hàm lấy tuần hiện tại
  function getCurrentWeek() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  }

  // Hàm lấy tuần từ ngày
  function getWeekFromDate(date) {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  }

  // Hàm lấy ngày trong tuần
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

  // Hàm tính doanh thu và thống kê
  const calculateRevenueAndStats = (orders, week) => {
    const weekDates = getDatesOfWeek(week);
    const startDate = weekDates[0];
    const endDate = weekDates[6];
    endDate.setHours(23, 59, 59, 999);

    // Lọc đơn hàng trong tuần
    const weeklyOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at || order.order_date);
      return orderDate >= startDate && orderDate <= endDate;
    });

    // Đơn hàng đã nhận (tính doanh thu)
    const receivedOrders = weeklyOrders.filter(order => order.status === 'received');
    
    // Đơn hàng chờ xác nhận
    const pendingOrders = weeklyOrders.filter(order => order.status === 'pending');
    
    // Đơn hàng đã thanh toán
    const paidOrders = weeklyOrders.filter(order => 
      order.is_paid || (order.status === 'received' && order.payment_method === 'cod')
    );

    // Tính doanh thu theo ngày (chỉ từ đơn hàng đã nhận)
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

    // Tính tổng giá trị đơn hàng đã thanh toán
    const paidRevenue = paidOrders.reduce((sum, order) => 
      sum + (parseFloat(order.total_amount) || 0), 0
    );

    return {
      // Doanh thu
      weeklyRevenue: totalRevenue,
      dailyRevenue,
      totalOrders: receivedOrders.length,
      averageOrderValue: receivedOrders.length > 0 ? totalRevenue / receivedOrders.length : 0,
      
      // Thống kê
      pendingOrders: pendingOrders, // Mảng đơn hàng
      pendingOrdersCount: pendingOrders.length, // Số lượng
      pendingRevenue: pendingRevenue,
      paidOrders: paidOrders, // Mảng đơn hàng
      paidOrdersCount: paidOrders.length, // Số lượng
      paidRevenue: paidRevenue,
      totalWeeklyOrders: weeklyOrders.length,
      
      // Chi tiết đơn hàng
      allOrders: weeklyOrders,
      receivedOrders,
    };
  };

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
  }, [orders, selectedWeek]);

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
    const currentDate = new Date();
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

  // Định dạng tháng
  const formatMonthYear = (date) => {
    return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  };

  // Lấy tên sản phẩm từ order details
  const getProductNames = (order) => {
    if (!order.order_details || order.order_details.length === 0) {
      return ['Không có thông tin sản phẩm'];
    }
    
    return order.order_details.map(detail => {
      const product = products.find(p => p.id === detail.product_id);
      return product ? product.name : `Sản phẩm #${detail.product_id}`;
    });
  };

  // Vẽ biểu đồ
  const renderSimpleChart = () => {
    const weekDates = getDatesOfWeek(selectedWeek);
    const maxRevenue = Math.max(...Object.values(revenueData.dailyRevenue), 1);
    
    return (
      <div className="h-64 flex items-end justify-between space-x-2 px-4 py-6">
        {weekDates.map((date, index) => {
          const dateKey = date.toISOString().split('T')[0];
          const revenue = revenueData.dailyRevenue[dateKey] || 0;
          const dayName = getDayName(date).substring(0, 3);
          const height = maxRevenue > 0 ? (revenue / maxRevenue) * 80 : 0;
          
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="text-xs text-gray-500 mb-1">{dayName}</div>
              <div 
                className={`w-full rounded-t transition-all duration-500 ${
                  revenue > 0 ? 'bg-gradient-to-t from-green-500 to-green-400' : 'bg-gray-200'
                }`}
                style={{ height: `${Math.max(height, 8)}%` }}
                title={`${formatDate(dateKey)}: ${formatCurrency(revenue)}`}
              >
                <div className="text-xs text-white text-center mt-1 opacity-0 hover:opacity-100 transition-opacity">
                  {revenue > 0 ? formatCurrency(revenue) : ''}
                </div>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {formatDate(dateKey).split('/')[0]}
              </div>
            </div>
          );
        })}
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
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Không có đơn hàng chờ xác nhận trong tuần này
        </div>
      );
    }

    return (
      <div>
        {/* Grid hiển thị 5 sản phẩm trên 1 hàng */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          {visibleOrders.map(order => (
            <div key={order.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">#{order.id}</h4>
                  <p className="text-xs text-gray-600 mt-1">{order.name}</p>
                  <p className="text-xs text-gray-500">{order.phone}</p>
                </div>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2">
                  Chờ
                </span>
              </div>
              
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-1">Sản phẩm:</p>
                <div className="text-xs text-gray-600 space-y-1 max-h-20 overflow-y-auto">
                  {getProductNames(order).slice(0, 3).map((product, idx) => (
                    <div key={idx} className="flex items-start">
                      <span className="text-yellow-500 mr-1">•</span>
                      <span className="flex-1 line-clamp-2">{product}</span>
                    </div>
                  ))}
                  {getProductNames(order).length > 3 && (
                    <div className="text-xs text-yellow-600 font-medium">
                      +{getProductNames(order).length - 3} sản phẩm khác
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-yellow-200">
                <span className="text-sm font-bold text-orange-600">
                  {formatCurrency(parseFloat(order.total_amount) || 0)}
                </span>
                <div className="text-right">
                  <span className="text-xs text-gray-500 block">
                    {order.payment_method === 'cod' ? 'COD' : 'Online'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(order.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Nút điều khiển lazy loading */}
        <div className="flex justify-center space-x-4">
          {hasMore && (
            <button
              onClick={() => setPendingVisibleCount(prev => prev + 5)}
              className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Xem thêm 5 đơn hàng</span>
            </button>
          )}
          
          {pendingVisibleCount > 5 && (
            <button
              onClick={() => setPendingVisibleCount(5)}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span>Thu gọn</span>
            </button>
          )}
        </div>

        {/* Hiển thị số lượng */}
        <div className="text-center mt-4 text-sm text-gray-500">
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
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Không có đơn hàng đã thanh toán trong tuần này
        </div>
      );
    }

    return (
      <div>
        {/* Grid hiển thị 5 sản phẩm trên 1 hàng */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          {visibleOrders.map(order => (
            <div key={order.id} className="border border-green-200 bg-green-50 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">#{order.id}</h4>
                  <p className="text-xs text-gray-600 mt-1">{order.name}</p>
                  <p className="text-xs text-gray-500">{order.phone}</p>
                </div>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2">
                  Đã TT
                </span>
              </div>
              
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-1">Sản phẩm:</p>
                <div className="text-xs text-gray-600 space-y-1 max-h-20 overflow-y-auto">
                  {getProductNames(order).slice(0, 3).map((product, idx) => (
                    <div key={idx} className="flex items-start">
                      <span className="text-green-500 mr-1">•</span>
                      <span className="flex-1 line-clamp-2">{product}</span>
                    </div>
                  ))}
                  {getProductNames(order).length > 3 && (
                    <div className="text-xs text-green-600 font-medium">
                      +{getProductNames(order).length - 3} sản phẩm khác
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-green-200">
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(parseFloat(order.total_amount) || 0)}
                </span>
                <div className="text-right">
                  <span className="text-xs text-gray-500 block">
                    {order.payment_method === 'cod' ? 'COD' : 'Online'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {order.status === 'received' ? 'Đã nhận' : 'Đang xử lý'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Nút điều khiển lazy loading */}
        <div className="flex justify-center space-x-4">
          {hasMore && (
            <button
              onClick={() => setPaidVisibleCount(prev => prev + 5)}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Xem thêm 5 đơn hàng</span>
            </button>
          )}
          
          {paidVisibleCount > 5 && (
            <button
              onClick={() => setPaidVisibleCount(5)}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span>Thu gọn</span>
            </button>
          )}
        </div>

        {/* Hiển thị số lượng */}
        <div className="text-center mt-4 text-sm text-gray-500">
          Đang hiển thị {Math.min(visibleOrders.length, paidVisibleCount)} / {paidOrders.length} đơn hàng
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu doanh thu...</p>
        </div>
      </div>
    );
  }

  const weekDates = getDatesOfWeek(selectedWeek);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Doanh thu & Đơn hàng</h1>
        <p className="text-gray-600">
          Theo dõi doanh thu và tình trạng đơn hàng theo tuần
        </p>
      </div>

      {/* Week Selector với Calendar */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Chọn tuần</h2>
          
          <div className="flex items-center space-x-4">
            {/* Navigation Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Tuần {selectedWeek}</span>
              </button>

              <button
                onClick={() => navigateWeek('next')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Hiển thị khoảng thời gian của tuần */}
        <div className="text-center text-lg font-semibold text-gray-700 bg-blue-50 py-2 rounded-lg">
          {formatDate(weekDates[0].toISOString())} - {formatDate(weekDates[6].toISOString())}
        </div>

        {/* Calendar Popup */}
        {showCalendar && (
          <div className="absolute mt-2 bg-white border border-gray-300 rounded-lg shadow-xl z-50 p-4 w-80 top-20 right-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h3 className="font-semibold text-gray-700">
                {formatMonthYear(selectedDate)}
              </h3>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="space-y-1">
              {renderCalendar()}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setSelectedDate(new Date());
                  setSelectedWeek(getCurrentWeek());
                  setShowCalendar(false);
                }}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Chọn tuần hiện tại
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab("revenue")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "revenue" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            📊 Doanh thu
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "pending" 
                ? "bg-yellow-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            ⏳ Chờ xác nhận ({revenueData.pendingOrdersCount || 0})
          </button>
          <button
            onClick={() => setActiveTab("paid")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "paid" 
                ? "bg-green-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            ✅ Đã thanh toán ({revenueData.paidOrdersCount || 0})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "revenue" && (
        <>
          {/* Revenue Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Doanh thu tuần</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(revenueData.weeklyRevenue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Đơn hàng đã nhận</p>
                  <p className="text-2xl font-bold text-gray-900">{revenueData.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Giá trị trung bình</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(revenueData.averageOrderValue)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Trên mỗi đơn hàng</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Tuần</p>
                  <p className="text-2xl font-bold text-gray-900">#{selectedWeek}</p>
                  <p className="text-xs text-gray-500 mt-1">Năm {new Date().getFullYear()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Biểu đồ doanh thu */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              Biểu đồ doanh thu tuần #{selectedWeek}
            </h3>
            <div className="border border-gray-200 rounded-lg bg-white">
              {renderSimpleChart()}
            </div>
          </div>

          {/* Daily Revenue Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Doanh thu theo ngày trong tuần</h3>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {weekDates.map((date, index) => {
                const dateKey = date.toISOString().split('T')[0];
                const revenue = revenueData.dailyRevenue[dateKey] || 0;
                const dayName = getDayName(date);
                
                return (
                  <div key={index} className="text-center p-4 border border-gray-200 rounded-lg">
                    <p className="font-medium text-gray-900">{dayName}</p>
                    <p className="text-sm text-gray-600 mb-2">{formatDate(dateKey)}</p>
                    <p className={`text-lg font-bold ${
                      revenue > 0 ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {formatCurrency(revenue)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {activeTab === "pending" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Đơn hàng chờ xác nhận - Tuần #{selectedWeek}
            </h3>
            <div className="text-right">
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(revenueData.pendingRevenue || 0)}
              </p>
              <p className="text-sm text-gray-500">
                {revenueData.pendingOrdersCount || 0} đơn hàng
              </p>
            </div>
          </div>
          {renderPendingOrders()}
        </div>
      )}

      {activeTab === "paid" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Đơn hàng đã thanh toán - Tuần #{selectedWeek}
            </h3>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(revenueData.paidRevenue || 0)}
              </p>
              <p className="text-sm text-gray-500">
                {revenueData.paidOrdersCount || 0} đơn hàng
              </p>
            </div>
          </div>
          {renderPaidOrders()}
        </div>
      )}
    </div>
  );
}