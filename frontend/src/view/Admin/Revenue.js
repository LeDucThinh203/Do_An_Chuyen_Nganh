// src/view/Admin/Revenue.js
import React, { useState, useEffect } from "react";
import { getAllOrders } from "../../api";

export default function Revenue() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [revenueData, setRevenueData] = useState({
    weeklyRevenue: 0,
    dailyRevenue: {},
    totalOrders: 0,
    averageOrderValue: 0
  });

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

  // Hàm tính doanh thu
  const calculateRevenue = (orders, week) => {
    const weekDates = getDatesOfWeek(week);
    const startDate = weekDates[0];
    const endDate = weekDates[6];
    endDate.setHours(23, 59, 59, 999);

    const weeklyOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at || order.order_date);
      const isInWeek = orderDate >= startDate && orderDate <= endDate;
      const isReceived = order.status === 'received';
      return isInWeek && isReceived;
    });

    const dailyRevenue = {};
    weekDates.forEach(date => {
      const dateKey = date.toISOString().split('T')[0];
      dailyRevenue[dateKey] = 0;
    });

    let totalRevenue = 0;
    weeklyOrders.forEach(order => {
      const orderDate = new Date(order.created_at || order.order_date);
      const dateKey = orderDate.toISOString().split('T')[0];
      const orderTotal = parseFloat(order.total_amount) || 0;
      
      dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + orderTotal;
      totalRevenue += orderTotal;
    });

    return {
      weeklyRevenue: totalRevenue,
      dailyRevenue,
      totalOrders: weeklyOrders.length,
      averageOrderValue: weeklyOrders.length > 0 ? totalRevenue / weeklyOrders.length : 0
    };
  };

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const ordersData = await getAllOrders();
        setOrders(ordersData);
      } catch (error) {
        console.error("Lỗi khi lấy đơn hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Tính toán doanh thu
  useEffect(() => {
    if (orders.length > 0) {
      const revenue = calculateRevenue(orders, selectedWeek);
      setRevenueData(revenue);
    }
  }, [orders, selectedWeek]);

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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu doanh thu...</p>
        </div>
      </div>
    );
  }

  const weekDates = getDatesOfWeek(selectedWeek);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Doanh thu</h1>
        <p className="text-gray-600">
          Theo dõi doanh thu từ các đơn hàng <span className="font-semibold text-green-600">đã nhận hàng</span> theo tuần
        </p>
      </div>

      {/* Week Selector với Calendar */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
          <div className="absolute mt-2 bg-white border border-gray-300 rounded-lg shadow-xl z-50 p-4 w-80">
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
    </div>
  );
}