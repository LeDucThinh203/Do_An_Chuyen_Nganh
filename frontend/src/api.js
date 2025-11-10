// ================= Base =================
const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return {};
  }
};

// ================= Product API =================
const PRODUCT_API_URL = "http://localhost:3006/product";

export const getAllProducts = async () => {
  const res = await fetch(PRODUCT_API_URL);
  if (!res.ok) throw new Error("Lấy sản phẩm thất bại");
  return await safeJson(res);
};

export const getProductById = async (id) => {
  const res = await fetch(`${PRODUCT_API_URL}/${id}`);
  if (!res.ok) throw new Error("Lấy sản phẩm thất bại");
  return await safeJson(res);
};

export const createProduct = async (data) => {
  const res = await fetch(PRODUCT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Tạo sản phẩm thất bại");
  return await safeJson(res);
};

export const updateProduct = async (id, data) => {
  const res = await fetch(`${PRODUCT_API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Cập nhật sản phẩm thất bại");
  return await safeJson(res);
};

export const deleteProduct = async (id) => {
  const res = await fetch(`${PRODUCT_API_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Xóa sản phẩm thất bại");
  return true;
};

// ================= Category API =================
const CATEGORY_API_URL = "http://localhost:3006/category";

export const getAllCategories = async () => {
  const res = await fetch(CATEGORY_API_URL);
  if (!res.ok) throw new Error("Lấy danh mục thất bại");
  return await safeJson(res);
};

export const getCategoryById = async (id) => {
  const res = await fetch(`${CATEGORY_API_URL}/${id}`);
  if (!res.ok) throw new Error("Lấy danh mục thất bại");
  return await safeJson(res);
};

export const createCategory = async (data) => {
  const res = await fetch(CATEGORY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Tạo danh mục thất bại");
  return await safeJson(res);
};

export const updateCategory = async (id, data) => {
  const res = await fetch(`${CATEGORY_API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Cập nhật danh mục thất bại");
  return await safeJson(res);
};

export const deleteCategory = async (id) => {
  const res = await fetch(`${CATEGORY_API_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Xóa danh mục thất bại");
  return true;
};

// ================= Size API =================
const SIZE_API_URL = "http://localhost:3006/sizes";

export const getAllSizes = async () => {
  const res = await fetch(SIZE_API_URL);
  if (!res.ok) throw new Error("Lấy size thất bại");
  return await safeJson(res);
};

export const getSizeById = async (id) => {
  const res = await fetch(`${SIZE_API_URL}/${id}`);
  if (!res.ok) throw new Error("Lấy size thất bại");
  return await safeJson(res);
};

export const createSize = async (data) => {
  const res = await fetch(SIZE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Tạo size thất bại");
  return await safeJson(res);
};

export const updateSize = async (id, data) => {
  const res = await fetch(`${SIZE_API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Cập nhật size thất bại");
  return await safeJson(res);
};

export const deleteSize = async (id) => {
  const res = await fetch(`${SIZE_API_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Xóa size thất bại");
  return true;
};

// ================= Account API =================
const ACCOUNT_API_URL = "http://localhost:3006/account";

export const login = async ({ email, password }) => {
  const res = await fetch(`${ACCOUNT_API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || "Email hoặc mật khẩu không đúng");
  return data;
};

export const register = async ({ email, username, password, role = "user" }) => {
  const res = await fetch(`${ACCOUNT_API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password, role }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || "Đăng ký thất bại");
  return data;
};

export const getAllAccounts = async () => {
  const res = await fetch(ACCOUNT_API_URL);
  if (!res.ok) throw new Error("Lấy danh sách tài khoản thất bại");
  return await safeJson(res);
};

export const getAccountById = async (id) => {
  const res = await fetch(`${ACCOUNT_API_URL}/${id}`);
  if (!res.ok) throw new Error("Lấy thông tin tài khoản thất bại");
  return await safeJson(res);
};

export const updateAccount = async (id, data) => {
  const res = await fetch(`${ACCOUNT_API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Cập nhật tài khoản thất bại");
  return await safeJson(res);
};

export const deleteAccount = async (id) => {
  const res = await fetch(`${ACCOUNT_API_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Xóa tài khoản thất bại");
  return true;
};

export const forgotPassword = async (email) => {
  const res = await fetch(`${ACCOUNT_API_URL}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || "Không thể gửi email khôi phục mật khẩu");
  return data;
};

export const resetPassword = async (token, newPassword) => {
  const res = await fetch(`${ACCOUNT_API_URL}/reset-password/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newPassword }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || "Đặt lại mật khẩu thất bại");
  return data;
};

// ================= Address API =================
const ADDRESS_API_URL = "http://localhost:3006/address";

export const getAllAddresses = async () => {
  const res = await fetch(ADDRESS_API_URL);
  if (!res.ok) throw new Error("Lấy danh sách địa chỉ thất bại");
  return await safeJson(res);
};

export const getAddressById = async (id) => {
  const res = await fetch(`${ADDRESS_API_URL}/${id}`);
  if (!res.ok) throw new Error("Lấy địa chỉ thất bại");
  return await safeJson(res);
};

export const createAddress = async (data) => {
  const res = await fetch(ADDRESS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Tạo địa chỉ thất bại");
  return await safeJson(res);
};

export const updateAddress = async (id, data) => {
  const res = await fetch(`${ADDRESS_API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Cập nhật địa chỉ thất bại");
  return await safeJson(res);
};

export const deleteAddress = async (id) => {
  const res = await fetch(`${ADDRESS_API_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Xóa địa chỉ thất bại");
  return true;
};

// ================= ProductSize API =================
const PRODUCT_SIZE_API_URL = "http://localhost:3006/product_sizes";

export const getAllProductSizes = async () => {
  const res = await fetch(PRODUCT_SIZE_API_URL);
  if (!res.ok) throw new Error("Lấy product sizes thất bại");
  return await safeJson(res);
};

export const createProductSize = async (data) => {
  const res = await fetch(PRODUCT_SIZE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Tạo product size thất bại");
  return await safeJson(res);
};

export const deleteProductSize = async (id) => {
  const res = await fetch(`${PRODUCT_SIZE_API_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Xóa product size thất bại");
  return true;
};

// ================= Order API =================
const ORDER_API_URL = "http://localhost:3006/orders";

export const createOrder = async (data) => {
  const res = await fetch(ORDER_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Tạo đơn hàng thất bại");
  return await safeJson(res);
};

export const getAllOrders = async () => {
  const res = await fetch(ORDER_API_URL);
  if (!res.ok) throw new Error("Lấy danh sách đơn hàng thất bại");
  return await safeJson(res);
};

export const getOrderById = async (id) => {
  const res = await fetch(`${ORDER_API_URL}/${id}`);
  if (!res.ok) throw new Error("Lấy thông tin đơn hàng thất bại");
  return await safeJson(res);
};

export const updateOrderStatus = async (id, data) => {
  const res = await fetch(`${ORDER_API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Cập nhật trạng thái đơn hàng thất bại");
  return await safeJson(res);
};

// Hàm xóa đơn hàng mới - xóa order_details trước rồi mới xóa orders
export const deleteOrder = async (id) => {
  try {
    console.log(`🔄 Bắt đầu xóa đơn hàng ID: ${id}`);
    
    // Bước 1: Lấy thông tin đơn hàng để có danh sách order_details
    console.log(`📥 Lấy thông tin đơn hàng ${id}...`);
    const order = await getOrderById(id);
    
    if (!order) {
      throw new Error("Đơn hàng không tồn tại");
    }
    
    console.log(`📋 Đơn hàng có ${order.order_details?.length || 0} chi tiết`);

    // Bước 2: Xóa tất cả order_details của đơn hàng này
    if (order.order_details && order.order_details.length > 0) {
      console.log(`🗑️ Đang xóa ${order.order_details.length} chi tiết đơn hàng...`);
      
      for (const detail of order.order_details) {
        try {
          // Xóa từng order_detail
          const deleteDetailRes = await fetch(`${ORDER_DETAILS_API_URL}/${detail.order_detail_id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
          });
          
          if (!deleteDetailRes.ok) {
            console.warn(`⚠️ Không thể xóa order_detail ${detail.order_detail_id}`);
          } else {
            console.log(`✅ Đã xóa order_detail ${detail.order_detail_id}`);
          }
        } catch (detailError) {
          console.warn(`⚠️ Lỗi khi xóa order_detail ${detail.order_detail_id}:`, detailError);
        }
      }
    }

    // Bước 3: Xóa đơn hàng chính
    console.log(`🗑️ Đang xóa đơn hàng chính ${id}...`);
    const deleteOrderRes = await fetch(`${ORDER_API_URL}/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });
    
    console.log(`📊 Response status: ${deleteOrderRes.status} ${deleteOrderRes.statusText}`);
    
    if (!deleteOrderRes.ok) {
      let errorData = {};
      try {
        errorData = await deleteOrderRes.json();
      } catch (jsonError) {
        // Ignore JSON parse error
      }
      
      if (deleteOrderRes.status === 404) {
        throw new Error("Đơn hàng không tồn tại");
      } else if (deleteOrderRes.status === 500) {
        throw new Error("Lỗi server khi xóa đơn hàng");
      } else {
        throw new Error(errorData.error || `Xóa đơn hàng thất bại (${deleteOrderRes.status})`);
      }
    }
    
    console.log('✅ Xóa đơn hàng thành công');
    return true;
    
  } catch (error) {
    console.error('❌ Lỗi trong hàm deleteOrder:', error);
    throw error;
  }
};

// ================= Order Details API =================
const ORDER_DETAILS_API_URL = "http://localhost:3006/order_details";

export const getAllOrderDetails = async () => {
  const res = await fetch(ORDER_DETAILS_API_URL);
  if (!res.ok) throw new Error("Lấy danh sách chi tiết đơn hàng thất bại");
  return await safeJson(res);
};

export const getOrderDetailById = async (id) => {
  const res = await fetch(`${ORDER_DETAILS_API_URL}/${id}`);
  if (!res.ok) throw new Error("Lấy thông tin chi tiết đơn hàng thất bại");
  return await safeJson(res);
};

export const createOrderDetail = async (data) => {
  const res = await fetch(ORDER_DETAILS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Tạo chi tiết đơn hàng thất bại");
  return await safeJson(res);
};

export const updateOrderDetail = async (id, data) => {
  const res = await fetch(`${ORDER_DETAILS_API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Cập nhật chi tiết đơn hàng thất bại");
  return await safeJson(res);
};

export const deleteOrderDetail = async (id) => {
  const res = await fetch(`${ORDER_DETAILS_API_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Xóa chi tiết đơn hàng thất bại");
  return true;
};

// ================= Rating API =================
const RATING_API_URL = "http://localhost:3006/rating";

export const getAllRatings = async () => {
  const res = await fetch(RATING_API_URL);
  if (!res.ok) throw new Error("Lấy danh sách đánh giá thất bại");
  return await safeJson(res);
};

export const getRatingById = async (id) => {
  const res = await fetch(`${RATING_API_URL}/${id}`);
  if (!res.ok) throw new Error("Lấy thông tin đánh giá thất bại");
  return await safeJson(res);
};

export const createRating = async (data) => {
  const res = await fetch(RATING_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Tạo đánh giá thất bại");
  return await safeJson(res);
};

export const updateRating = async (id, data) => {
  const res = await fetch(`${RATING_API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Cập nhật đánh giá thất bại");
  return await safeJson(res);
};

export const deleteRating = async (id) => {
  const res = await fetch(`${RATING_API_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Xóa đánh giá thất bại");
  return true;
};