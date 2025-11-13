// src/view/Cart/Confirmation.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder, getAllProductSizes, getAllSizes, createVNPayPaymentUrl } from "../../api";

export default function Confirmation() {
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [productSizes, setProductSizes] = useState([]);
  const [sizes, setSizes] = useState([]);

  useEffect(() => {
    const storedOrder = JSON.parse(localStorage.getItem("last_order"));
    const storedUser = JSON.parse(localStorage.getItem("user"));
    
    if (!storedOrder) {
      navigate("/");
      return;
    }
    
    setOrderData(storedOrder);
    setUser(storedUser);
    loadProductSizesData();
  }, [navigate]);

  const loadProductSizesData = async () => {
    try {
      const [productSizesData, sizesData] = await Promise.all([
        getAllProductSizes(),
        getAllSizes()
      ]);
      setProductSizes(productSizesData);
      setSizes(sizesData);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu sizes:", err);
    }
  };

  // Hàm tìm product_sizes_id dựa trên product_id và size
  const findProductSizeId = (productId, sizeName) => {
    if (!productId || !sizeName) return null;
    
    // Tìm size_id từ tên size
    const size = sizes.find(s => s.size === sizeName);
    if (!size) return null;
    
    // Tìm product_sizes_id từ product_id và size_id
    const productSize = productSizes.find(ps => 
      ps.product_id === productId && ps.size_id === size.id
    );
    
    return productSize ? productSize.id : null;
  };

  if (!orderData) {
    return (
      <div className="text-center mt-20 text-gray-500">
        Đang tải thông tin đơn hàng...
      </div>
    );
  }

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Chuẩn bị dữ liệu order_details từ cart items
      const orderDetails = orderData.items.map(item => {
        // Tìm product_sizes_id dựa trên product_id và size
        const productSizesId = findProductSizeId(item.id, item.size);
        
        if (!productSizesId) {
          throw new Error(`Không tìm thấy product_sizes_id cho sản phẩm "${item.name}" với size "${item.size}"`);
        }

        return {
          product_sizes_id: productSizesId,
          quantity: item.quantity,
          price: item.price
        };
      });

      // Kiểm tra xem có order details hợp lệ không
      if (orderDetails.length === 0) {
        throw new Error("Không có sản phẩm hợp lệ để đặt hàng");
      }

      const orderPayload = {
        name: orderData.name,
        phone: orderData.phone,
        address: orderData.address,
        account_id: user?.id || null,
        total_amount: orderData.total,
        payment_method: orderData.payment_method || 'cod',
        is_paid: false, // Mặc định chưa thanh toán
        order_details: orderDetails
      };

      console.log("Order payload:", orderPayload); // Debug log

      // Gọi API để tạo order
      const result = await createOrder(orderPayload);
      
      if (result && result.id) {
        console.log("Order created successfully:", result); // Debug log
        
        // Kiểm tra phương thức thanh toán
        if (orderData.payment_method === 'vnpay') {
          // Tạo URL thanh toán VNPay
          try {
            const vnpayData = {
              orderId: result.id.toString(),
              amount: orderData.total,
              orderInfo: `Thanh toan don hang #${result.id}`,
              orderType: 'billpayment',
              language: 'vn'
            };
            
            const vnpayResponse = await createVNPayPaymentUrl(vnpayData);
            
            if (vnpayResponse.success && vnpayResponse.data.paymentUrl) {
              // Lưu thông tin đơn hàng trước khi chuyển hướng
              localStorage.setItem('pending_order_id', result.id);
              localStorage.removeItem("last_order");
              localStorage.removeItem("cart");
              localStorage.removeItem("checkout_items");
              localStorage.removeItem("checkout_form");
              
              // Chuyển hướng đến VNPay
              window.location.href = vnpayResponse.data.paymentUrl;
              return; // Dừng xử lý tiếp
            } else {
              throw new Error("Không thể tạo link thanh toán VNPay");
            }
          } catch (vnpayError) {
            console.error("VNPay error:", vnpayError);
            setError("Lỗi khi tạo link thanh toán VNPay. Vui lòng thử phương thức khác.");
            setLoading(false);
            return;
          }
        } else {
          // Thanh toán COD hoặc Bank - chuyển đến trang thành công
          // Xóa dữ liệu tạm sau khi tạo order thành công
          localStorage.removeItem("last_order");
          localStorage.removeItem("cart");
          localStorage.removeItem("checkout_items");
          localStorage.removeItem("checkout_form");
          
          // Chuyển đến trang thông báo thành công
          navigate("/order-success", { 
            state: { 
              orderId: result.id,
              orderData: orderPayload 
            } 
          });
        }
      } else {
        throw new Error("Không nhận được ID đơn hàng từ server");
      }
      
    } catch (err) {
      console.error("Lỗi khi tạo đơn hàng:", err);
      setError(err.message || "Lưu đơn hàng thất bại. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Giữ lại dữ liệu và quay lại trang checkout
    navigate("/checkout");
  };

  const getPaymentMethodText = (method) => {
    switch(method) {
      case 'cod': return 'Thanh toán khi nhận hàng (COD)';
      case 'vnpay': return 'Thanh toán qua VNPay';
      default: return method;
    }
  };

  // Kiểm tra xem tất cả sản phẩm có product_sizes_id hợp lệ không
  const validateOrderItems = () => {
    if (!orderData.items || orderData.items.length === 0) return false;
    
    return orderData.items.every(item => {
      const productSizesId = findProductSizeId(item.id, item.size);
      return productSizesId !== null;
    });
  };

  const isValidOrder = validateOrderItems();

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10">
      <div className="bg-white shadow-lg rounded-xl p-8">
        <h2 className="text-3xl font-bold text-center text-green-600 mb-8">Xác nhận đơn hàng</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Lỗi:</strong> {error}
            <br />
            <span className="text-sm">Vui lòng quay lại giỏ hàng và thử lại.</span>
          </div>
        )}

        {!isValidOrder && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
            <strong>Cảnh báo:</strong> Một số sản phẩm không có size hợp lệ. Vui lòng quay lại giỏ hàng để kiểm tra.
          </div>
        )}

        {/* Thông tin đơn hàng */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Thông tin khách hàng */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Thông tin giao hàng</h3>
            <div className="space-y-3">
              <p><strong className="text-gray-700">Họ tên:</strong> {orderData.name}</p>
              <p><strong className="text-gray-700">Số điện thoại:</strong> {orderData.phone}</p>
              <p>
                <strong className="text-gray-700">Địa chỉ:</strong> 
                <span className="block mt-1 text-gray-600">
                  {orderData.address}
                </span>
              </p>
              <p>
                <strong className="text-gray-700">Phương thức thanh toán:</strong> 
                <span className="text-green-600 font-medium ml-2">
                  {getPaymentMethodText(orderData.payment_method)}
                </span>
              </p>
            </div>
          </div>

          {/* Chi tiết đơn hàng */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Chi tiết đơn hàng</h3>
            <div className="space-y-4">
              {orderData.items.map((item, index) => {
                const productSizesId = findProductSizeId(item.id, item.size);
                const isValid = productSizesId !== null;
                
                return (
                  <div 
                    key={index} 
                    className={`flex items-center gap-4 border-b pb-4 last:border-b-0 ${
                      !isValid ? 'border-red-200 bg-red-50' : ''
                    }`}
                  >
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-16 h-16 object-cover rounded-lg border"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      {item.size && (
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-gray-600">
                            Size: <span className="font-medium">{item.size}</span>
                          </p>
                          {!isValid && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                              Size không hợp lệ
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-gray-500 text-sm">
                          Số lượng: {item.quantity}
                        </p>
                        <p className="text-red-600 font-semibold">
                          {(item.price * item.quantity).toLocaleString()} ₫
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-300">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Tổng tiền:</span>
                <span className="text-2xl font-bold text-green-600">
                  {Number(orderData.total).toLocaleString()} ₫
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Thông báo quan trọng */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Quan trọng
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Vui lòng kiểm tra kỹ thông tin đơn hàng trước khi xác nhận. 
                  Sau khi xác nhận, đơn hàng sẽ được xử lý và không thể hủy.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="bg-gray-500 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Quay lại chỉnh sửa
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={loading || !isValidOrder}
            className={`px-8 py-3 rounded-lg transition font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              isValidOrder 
                ? "bg-green-600 text-white hover:bg-green-700" 
                : "bg-gray-400 text-gray-200 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </>
            ) : !isValidOrder ? (
              'Sản phẩm không hợp lệ'
            ) : (
              'Xác nhận đơn hàng →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}