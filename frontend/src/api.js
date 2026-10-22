// ================= Base =================
import Session from './Session/session';

// Production requests use a same-origin reverse proxy so the HttpOnly session
// cookie remains first-party. CRA proxies root paths to localhost in development.
const configuredApiUrl = (process.env.REACT_APP_API_URL || '').trim().replace(/\/$/, '');
const isNetlifyHosted = typeof window !== 'undefined' && window.location.hostname.endsWith('.netlify.app');
const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? (configuredApiUrl.startsWith('http') ? configuredApiUrl : '')
  : (isNetlifyHosted ? '/api' : (configuredApiUrl || '/api'));

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return {};
  }
};

const getApiHeaders = () => ({ "Content-Type": "application/json" });

let csrfRequest = null;
let cachedCsrfToken = '';

const readCsrfCookie = () => {
  if (typeof document === 'undefined') return '';
  const item = document.cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith('coolshop_csrf='));
  if (!item) return cachedCsrfToken;
  try {
    return decodeURIComponent(item.slice('coolshop_csrf='.length));
  } catch {
    return item.slice('coolshop_csrf='.length);
  }
};

const getCsrfToken = async () => {
  const current = readCsrfCookie();
  if (current) return current;
  if (!csrfRequest) {
    csrfRequest = (async () => {
      const response = await window.fetch(`${API_BASE_URL}/account/csrf`, { credentials: 'include' });
      const data = await safeJson(response);
      if (!response.ok || !data.csrfToken) throw new Error('Không thể khởi tạo bảo vệ CSRF. Hãy tải lại trang.');
      cachedCsrfToken = data.csrfToken;
      return data.csrfToken;
    })().finally(() => {
      csrfRequest = null;
    });
  }
  return csrfRequest;
};

const apiFetch = async (input, init = {}) => {
  const method = String(init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers || {});
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    headers.set('X-CSRF-Token', await getCsrfToken());
  }

  const response = await window.fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && Session.isLoggedIn() && !String(input).includes('/account/me')) {
    Session.clearUser();
  }
  return response;
};

const getErrorMessage = async (res, fallbackMessage) => {
  const data = await safeJson(res);
  return data?.error || data?.message || fallbackMessage;
};

// ================= Product API =================
const PRODUCT_API_URL = `${API_BASE_URL}/product`;

export const getAllProducts = async () => {
  const res = await apiFetch(PRODUCT_API_URL);
  if (!res.ok) throw new Error("Lấy sản phẩm thất bại");
  return await safeJson(res);
};

export const getProductsPage = async ({ limit = 25, cursor = null, categoryId = null, admin = false } = {}) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  if (categoryId != null) params.set("category_id", String(categoryId));
  const endpoint = admin ? `${PRODUCT_API_URL}/admin/all` : PRODUCT_API_URL;
  const res = await apiFetch(`${endpoint}?${params.toString()}`, admin ? { headers: getApiHeaders() } : undefined);
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to load products"));
  return await safeJson(res);
};

export const getStorefrontPage = async ({ limit = 24, cursor = null, categoryId = null } = {}) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  if (categoryId != null) params.set("category_id", String(categoryId));
  const res = await apiFetch(`${PRODUCT_API_URL}/storefront?${params.toString()}`);
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to load storefront"));
  return await safeJson(res);
};

export const getProductRatingsPage = async (productId, { limit = 20, cursor = null } = {}) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const res = await apiFetch(`${PRODUCT_API_URL}/${productId}/ratings?${params.toString()}`);
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to load product reviews"));
  return await safeJson(res);
};

export const getProductRatingEligibility = async (productId) => {
  const res = await apiFetch(`${PRODUCT_API_URL}/${productId}/rating-eligibility`, { headers: getApiHeaders() });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to check review eligibility"));
  return await safeJson(res);
};

export const getAllProductsAdmin = async () => {
  try {
    const res = await apiFetch(`${PRODUCT_API_URL}/admin/all`, {
      headers: getApiHeaders(),
    });

    if (res.ok) return await safeJson(res);

    // Fallback for environments where admin route/auth is not ready yet.
    if ([401, 403, 404, 405].includes(res.status)) {
      return await getAllProducts();
    }

    throw new Error(await getErrorMessage(res, "Lấy danh sách sản phẩm admin thất bại"));
  } catch (err) {
    // Network/CORS/proxy issues: keep ProductManager usable with public list.
    if (err?.name === 'TypeError' || /NetworkError|Failed to fetch/i.test(err?.message || '')) {
      return await getAllProducts();
    }
    throw err;
  }
};

export const getProductById = async (id) => {
  const res = await apiFetch(`${PRODUCT_API_URL}/${id}`);
  if (!res.ok) throw new Error("Lấy sản phẩm thất bại");
  return await safeJson(res);
};

export const getProductDetails = async (id) => {
  const res = await apiFetch(`${PRODUCT_API_URL}/${id}/details`);
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to load product details"));
  return await safeJson(res);
};

export const createProduct = async (data) => {
  const res = await apiFetch(PRODUCT_API_URL, {
    method: "POST",
    headers: getApiHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await safeJson(res);
    throw new Error(errorData.error || "Tạo sản phẩm thất bại");
  }
  return await safeJson(res);
};

export const updateProduct = async (id, data) => {
  const res = await apiFetch(`${PRODUCT_API_URL}/${id}`, {
    method: "PUT",
    headers: getApiHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Cập nhật sản phẩm thất bại");
  return await safeJson(res);
};

export const deleteProduct = async (id) => {
  const res = await apiFetch(`${PRODUCT_API_URL}/${id}`, {
    method: "DELETE",
    headers: getApiHeaders()
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Ẩn sản phẩm thất bại"));
  return true;
};

export const hardDeleteProduct = async (id) => {
  const res = await apiFetch(`${PRODUCT_API_URL}/${id}/hard-delete`, {
    method: "DELETE",
    headers: getApiHeaders()
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Xóa sản phẩm thất bại"));
  return true;
};

export const restoreProduct = async (id) => {
  try {
    const res = await apiFetch(`${PRODUCT_API_URL}/${id}/restore`, {
      method: "PATCH",
      headers: getApiHeaders(),
    });
    if (!res.ok) {
      const errorMessage = await getErrorMessage(res, "Khôi phục sản phẩm thất bại");
      throw new Error(errorMessage);
    }
    return await safeJson(res);
  } catch (err) {
    // Better error handling for network issues
    if (err?.name === 'TypeError' || /Network|Failed to fetch/i.test(err?.message || '')) {
      throw new Error("Khôi phục sản phẩm thất bại: Vui lòng kiểm tra kết nối mạng và thử lại");
    }
    throw err;
  }
};

// ================= Category API =================
const CATEGORY_API_URL = `${API_BASE_URL}/category`;

export const getAllCategories = async () => {
  const res = await apiFetch(CATEGORY_API_URL);
  if (!res.ok) throw new Error("Lấy danh mục thất bại");
  return await safeJson(res);
};

export const getCategoryById = async (id) => {
  const res = await apiFetch(`${CATEGORY_API_URL}/${id}`);
  if (!res.ok) throw new Error("Lấy danh mục thất bại");
  return await safeJson(res);
};

export const createCategory = async (data) => {
  const res = await apiFetch(CATEGORY_API_URL, {
    method: "POST",
    headers: getApiHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Tạo danh mục thất bại");
  return await safeJson(res);
};

export const updateCategory = async (id, data) => {
  const res = await apiFetch(`${CATEGORY_API_URL}/${id}`, {
    method: "PUT",
    headers: getApiHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Cập nhật danh mục thất bại");
  return await safeJson(res);
};

export const deleteCategory = async (id) => {
  const res = await apiFetch(`${CATEGORY_API_URL}/${id}`, {
    method: "DELETE",
    headers: getApiHeaders()
  });
  if (!res.ok) throw new Error("Xóa danh mục thất bại");
  return true;
};

// ================= Size API =================
const SIZE_API_URL = `${API_BASE_URL}/sizes`;

export const getAllSizes = async () => {
  const res = await apiFetch(SIZE_API_URL);
  if (!res.ok) throw new Error("Lấy size thất bại");
  return await safeJson(res);
};

export const getSizeById = async (id) => {
  const res = await apiFetch(`${SIZE_API_URL}/${id}`);
  if (!res.ok) throw new Error("Lấy size thất bại");
  return await safeJson(res);
};

export const createSize = async (data) => {
  const res = await apiFetch(SIZE_API_URL, {
    method: "POST",
    headers: getApiHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Tạo size thất bại"));
  return await safeJson(res);
};

export const updateSize = async (id, data) => {
  const res = await apiFetch(`${SIZE_API_URL}/${id}`, {
    method: "PUT",
    headers: getApiHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Cập nhật size thất bại"));
  return await safeJson(res);
};

export const deleteSize = async (id) => {
  const res = await apiFetch(`${SIZE_API_URL}/${id}`, {
    method: "DELETE",
    headers: getApiHeaders()
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Xóa size thất bại"));
  return true;
};

// ================= Account API =================
const ACCOUNT_API_URL = `${API_BASE_URL}/account`;

export const login = async ({ email, password }) => {
  const res = await apiFetch(`${ACCOUNT_API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || "Email hoặc mật khẩu không đúng");
  return data;
};

export const getCurrentUser = async () => {
  const res = await apiFetch(`${ACCOUNT_API_URL}/me`);
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Không thể khôi phục phiên đăng nhập'));
  return await safeJson(res);
};

export const logout = async () => {
  const res = await apiFetch(`${ACCOUNT_API_URL}/logout`, { method: 'POST' });
  if (!res.ok && res.status !== 401) {
    throw new Error(await getErrorMessage(res, 'Đăng xuất thất bại'));
  }
  Session.clearUser();
  return true;
};

export const getSupportSocketTicket = async () => {
  const res = await apiFetch(`${ACCOUNT_API_URL}/socket-ticket`, { method: 'POST' });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Không thể xác thực kết nối hỗ trợ'));
  return await safeJson(res);
};

export const register = async ({ email, username, password, role = "user" }) => {
  const res = await apiFetch(`${ACCOUNT_API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password, role }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || "Đăng ký thất bại");
  return data;
};

export const getAllAccounts = async () => {
  const res = await apiFetch(ACCOUNT_API_URL, {
    headers: getApiHeaders()
  });
  if (!res.ok) throw new Error("Lấy danh sách tài khoản thất bại");
  return await safeJson(res);
};

export const getAccountsPage = async ({ limit = 30, cursor = null, query = "" } = {}) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  if (query.trim()) params.set("q", query.trim());
  const res = await apiFetch(`${ACCOUNT_API_URL}?${params.toString()}`, { headers: getApiHeaders() });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to load accounts"));
  return await safeJson(res);
};

export const getAccountById = async (id) => {
  const res = await apiFetch(`${ACCOUNT_API_URL}/${id}`, {
    headers: getApiHeaders()
  });
  if (!res.ok) throw new Error("Lấy thông tin tài khoản thất bại");
  return await safeJson(res);
};

export const updateAccount = async (id, data) => {
  const res = await apiFetch(`${ACCOUNT_API_URL}/${id}`, {
    method: "PUT",
    headers: getApiHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Cập nhật tài khoản thất bại");
  return await safeJson(res);
};

export const deleteAccount = async (id) => {
  const res = await apiFetch(`${ACCOUNT_API_URL}/${id}`, {
    method: "DELETE",
    headers: getApiHeaders()
  });
  if (!res.ok) throw new Error("Xóa tài khoản thất bại");
  return true;
};

export const forgotPassword = async (email) => {
  const res = await apiFetch(`${ACCOUNT_API_URL}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || "Không thể gửi email khôi phục mật khẩu");
  return data;
};

export const resetPassword = async (token, newPassword) => {
  const res = await apiFetch(`${ACCOUNT_API_URL}/reset-password/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newPassword }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.error || "Đặt lại mật khẩu thất bại");
  return data;
};

// ================= Address API =================
const ADDRESS_API_URL = `${API_BASE_URL}/address`;

export const getAllAddresses = async () => {
  const res = await apiFetch(ADDRESS_API_URL);
  if (!res.ok) throw new Error("Lấy danh sách địa chỉ thất bại");
  return await safeJson(res);
};

export const getMyAddresses = async () => {
  const res = await apiFetch(`${ADDRESS_API_URL}/mine`, { headers: getApiHeaders() });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to load your addresses"));
  return await safeJson(res);
};

export const getAddressById = async (id) => {
  const res = await apiFetch(`${ADDRESS_API_URL}/${id}`);
  if (!res.ok) throw new Error("Lấy địa chỉ thất bại");
  return await safeJson(res);
};

export const createAddress = async (data) => {
  const res = await apiFetch(ADDRESS_API_URL, {
    method: "POST",
    headers: getApiHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Tạo địa chỉ thất bại");
  return await safeJson(res);
};

export const updateAddress = async (id, data) => {
  const res = await apiFetch(`${ADDRESS_API_URL}/${id}`, {
    method: "PUT",
    headers: getApiHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Cập nhật địa chỉ thất bại");
  return await safeJson(res);
};

export const deleteAddress = async (id) => {
  const res = await apiFetch(`${ADDRESS_API_URL}/${id}`, {
    method: "DELETE",
    headers: getApiHeaders()
  });
  if (!res.ok) throw new Error("Xóa địa chỉ thất bại");
  return true;
};


// ================= AI Chat API =================
const AI_API_URL = `${API_BASE_URL}/ai`;

export const aiChat = async ({ message, userId = null, sessionId = null, topK = 5, fast = false }) => {
  const res = await apiFetch(`${AI_API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, userId, sessionId, topK, fast })
  });
  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(data?.error || 'AI chat failed');
  }
  return await safeJson(res);
};

export const aiHistory = async (sessionId) => {
  const res = await apiFetch(`${AI_API_URL}/history?sessionId=${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new Error('Lấy lịch sử chat thất bại');
  return await safeJson(res);
};

export const clearMyAiHistory = async () => {
  const res = await apiFetch(`${AI_API_URL}/history/me`, {
    method: 'DELETE',
    headers: getApiHeaders(),
  });
  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(data?.error || 'Xóa lịch sử chat AI thất bại');
  }
  return await safeJson(res);
};

// ================= ProductSize API =================
const PRODUCT_SIZE_API_URL = `${API_BASE_URL}/product_sizes`;

export const getAllProductSizes = async (productIds = null) => {
  if (Array.isArray(productIds) && productIds.length === 0) return [];
  let endpoint = PRODUCT_SIZE_API_URL;
  if (Array.isArray(productIds)) {
    endpoint = `${PRODUCT_SIZE_API_URL}?product_ids=${encodeURIComponent(productIds.join(","))}`;
  } else if (productIds != null) {
    endpoint = `${PRODUCT_SIZE_API_URL}?product_id=${encodeURIComponent(productIds)}`;
  }
  const res = await apiFetch(endpoint);
  if (!res.ok) throw new Error("Lấy product sizes thất bại");
  return await safeJson(res);
};

export const createProductSize = async (data) => {
  const res = await apiFetch(PRODUCT_SIZE_API_URL, {
    method: "POST",
    headers: getApiHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Tạo product size thất bại"));
  return await safeJson(res);
};

export const updateProductSize = async (id, data) => {
  const res = await apiFetch(`${PRODUCT_SIZE_API_URL}/${id}`, {
    method: "PUT",
    headers: getApiHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Cập nhật product size thất bại"));
  return await safeJson(res);
};

export const deleteProductSize = async (id) => {
  const res = await apiFetch(`${PRODUCT_SIZE_API_URL}/${id}`, {
    method: "DELETE",
    headers: getApiHeaders()
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Xóa product size thất bại"));
  return true;
};

// ================= Account Cart API =================
const CART_API_URL = `${API_BASE_URL}/cart`;

const readCartResponse = async (res, fallback) => {
  if (!res.ok) throw new Error(await getErrorMessage(res, fallback));
  return await safeJson(res);
};

export const getMyCart = async () => {
  const res = await apiFetch(CART_API_URL);
  return readCartResponse(res, 'Không thể tải giỏ hàng.');
};

export const addMyCartItem = async ({ product_sizes_id, quantity = 1 }) => {
  const res = await apiFetch(`${CART_API_URL}/items`, {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify({ product_sizes_id, quantity }),
  });
  return readCartResponse(res, 'Không thể thêm sản phẩm vào giỏ hàng.');
};

export const updateMyCartItem = async (productSizesId, quantity) => {
  const res = await apiFetch(`${CART_API_URL}/items/${encodeURIComponent(productSizesId)}`, {
    method: 'PATCH',
    headers: getApiHeaders(),
    body: JSON.stringify({ quantity }),
  });
  return readCartResponse(res, 'Không thể cập nhật giỏ hàng.');
};

export const removeMyCartItem = async (productSizesId) => {
  const res = await apiFetch(`${CART_API_URL}/items/${encodeURIComponent(productSizesId)}`, {
    method: 'DELETE',
    headers: getApiHeaders(),
  });
  return readCartResponse(res, 'Không thể xóa sản phẩm khỏi giỏ hàng.');
};

export const clearMyCart = async () => {
  const res = await apiFetch(CART_API_URL, { method: 'DELETE', headers: getApiHeaders() });
  return readCartResponse(res, 'Không thể làm trống giỏ hàng.');
};

export const mergeMyCart = async (items) => {
  const res = await apiFetch(`${CART_API_URL}/merge`, {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify({ items }),
  });
  return readCartResponse(res, 'Không thể đồng bộ giỏ hàng với tài khoản.');
};

// ================= Order API =================
const ORDER_API_URL = `${API_BASE_URL}/orders`;

export const createOrder = async (data) => {
  console.log("📤 createOrder API call with data:", data);

  const res = await apiFetch(ORDER_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  console.log("📥 createOrder response status:", res.status, res.statusText);

  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
      console.error("❌ Server error response:", errorData);
    } catch (e) {
      const text = await res.text();
      console.error("❌ Server error text:", text);
      throw new Error(`Tạo đơn hàng thất bại (${res.status}): ${text}`);
    }
    throw new Error(errorData.error || errorData.message || "Tạo đơn hàng thất bại");
  }

  const result = await safeJson(res);
  console.log("✅ createOrder success:", result);
  return result;
};

export const getAllOrders = async () => {
  const res = await apiFetch(ORDER_API_URL);
  if (!res.ok) throw new Error("Lấy danh sách đơn hàng thất bại");
  return await safeJson(res);
};

export const getOrdersPage = async ({ limit = 25, cursor = null, from = null, to = null } = {}) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const res = await apiFetch(`${ORDER_API_URL}?${params.toString()}`, { headers: getApiHeaders() });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to load orders"));
  return await safeJson(res);
};

export const getMyOrdersPage = async ({ limit = 25, cursor = null } = {}) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const res = await apiFetch(`${ORDER_API_URL}/mine?${params.toString()}`, { headers: getApiHeaders() });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to load your orders"));
  return await safeJson(res);
};

export const getOrderById = async (id) => {
  const res = await apiFetch(`${ORDER_API_URL}/${id}`);
  if (!res.ok) throw new Error("Lấy thông tin đơn hàng thất bại");
  return await safeJson(res);
};

export const updateOrderStatus = async (id, data) => {
  const res = await apiFetch(`${ORDER_API_URL}/${id}`, {
    method: "PUT",
    headers: getApiHeaders(),
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
          const deleteDetailRes = await apiFetch(`${ORDER_DETAILS_API_URL}/${detail.order_detail_id}`, {
            method: "DELETE",
            headers: getApiHeaders()
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
    const deleteOrderRes = await apiFetch(`${ORDER_API_URL}/${id}`, {
      method: "DELETE",
      headers: getApiHeaders()
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
const ORDER_DETAILS_API_URL = `${API_BASE_URL}/order_details`;

export const getAllOrderDetails = async () => {
  const res = await apiFetch(ORDER_DETAILS_API_URL);
  if (!res.ok) throw new Error("Lấy danh sách chi tiết đơn hàng thất bại");
  return await safeJson(res);
};

export const getOrderDetailById = async (id) => {
  const res = await apiFetch(`${ORDER_DETAILS_API_URL}/${id}`);
  if (!res.ok) throw new Error("Lấy thông tin chi tiết đơn hàng thất bại");
  return await safeJson(res);
};

export const createOrderDetail = async (data) => {
  const res = await apiFetch(ORDER_DETAILS_API_URL, {
    method: "POST",
    headers: getApiHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Tạo chi tiết đơn hàng thất bại");
  return await safeJson(res);
};

export const updateOrderDetail = async (id, data) => {
  const res = await apiFetch(`${ORDER_DETAILS_API_URL}/${id}`, {
    method: "PUT",
    headers: getApiHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Cập nhật chi tiết đơn hàng thất bại");
  return await safeJson(res);
};

export const deleteOrderDetail = async (id) => {
  const res = await apiFetch(`${ORDER_DETAILS_API_URL}/${id}`, {
    method: "DELETE",
    headers: getApiHeaders()
  });
  if (!res.ok) throw new Error("Xóa chi tiết đơn hàng thất bại");
  return true;
};

// ================= Rating API =================
const RATING_API_URL = `${API_BASE_URL}/rating`;

export const getAllRatings = async () => {
  const res = await apiFetch(RATING_API_URL);
  if (!res.ok) throw new Error("Lấy danh sách đánh giá thất bại");
  return await safeJson(res);
};

export const getRatingById = async (id) => {
  const res = await apiFetch(`${RATING_API_URL}/${id}`);
  if (!res.ok) throw new Error("Lấy thông tin đánh giá thất bại");
  return await safeJson(res);
};

export const createRating = async (data) => {
  const res = await apiFetch(RATING_API_URL, {
    method: "POST",
    headers: getApiHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Tạo đánh giá thất bại");
  return await safeJson(res);
};

export const updateRating = async (id, data) => {
  const res = await apiFetch(`${RATING_API_URL}/${id}`, {
    method: "PUT",
    headers: getApiHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Cập nhật đánh giá thất bại");
  return await safeJson(res);
};

export const deleteRating = async (id) => {
  const res = await apiFetch(`${RATING_API_URL}/${id}`, {
    method: "DELETE",
    headers: getApiHeaders()
  });
  if (!res.ok) throw new Error("Xóa đánh giá thất bại");
  return true;
};


// ================= VNPay API =================
const VNPAY_API_URL = `${API_BASE_URL}/vnpay`;

export const createVNPayPaymentUrl = async (data) => {
  const res = await apiFetch(`${VNPAY_API_URL}/create_payment_url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Tạo link thanh toán VNPay thất bại");
  return await safeJson(res);
};

export const verifyVNPayReturn = async (queryParams) => {
  const queryString = new URLSearchParams(queryParams).toString();
  const res = await apiFetch(`${VNPAY_API_URL}/vnpay_return?${queryString}`);
  if (!res.ok) throw new Error("Xác thực thanh toán VNPay thất bại");
  return await safeJson(res);
};

export const updateOrderPaymentStatus = async (orderId, isPaid, paymentInfo) => {
  const res = await apiFetch(`${VNPAY_API_URL}/update_payment_status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId,
      is_paid: isPaid,
      payment_info: paymentInfo
    }),
  });
  if (!res.ok) throw new Error("Cập nhật trạng thái thanh toán thất bại");
  return await safeJson(res);
};

// ================= Support Chat API =================
const SUPPORT_CHAT_API_URL = `${API_BASE_URL}/support-chat`;

export const ensureSupportRoom = async ({ userId = null, guestId = null, username = 'Khach hang' }) => {
  const res = await apiFetch(`${SUPPORT_CHAT_API_URL}/rooms/ensure`, {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify({ userId, guestId, username })
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Tạo phòng chat thất bại'));
  return await safeJson(res);
};

export const getSupportRooms = async () => {
  const res = await apiFetch(`${SUPPORT_CHAT_API_URL}/rooms`, {
    headers: getApiHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Lấy danh sách phòng chat thất bại'));
  return await safeJson(res);
};

export const getSupportMessages = async (roomId, limit = 200) => {
  const res = await apiFetch(`${SUPPORT_CHAT_API_URL}/messages/${encodeURIComponent(roomId)}?limit=${limit}`, {
    headers: getApiHeaders(),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Lấy tin nhắn hỗ trợ thất bại'));
  return await safeJson(res);
};

export const sendSupportMessage = async ({ roomId, senderRole, senderId = null, senderName = '', message }) => {
  const res = await apiFetch(`${SUPPORT_CHAT_API_URL}/messages`, {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify({ roomId, senderRole, senderId, senderName, message })
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Gửi tin nhắn thất bại'));
  return await safeJson(res);
};

export const acknowledgeSupportRoom = async ({ roomId }) => {
  const res = await apiFetch(`${SUPPORT_CHAT_API_URL}/rooms/acknowledge`, {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify({ roomId })
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Xác nhận phòng chat thất bại'));
  return await safeJson(res);
};

export const resumeSupportRoomNotifications = async ({ roomId }) => {
  const res = await apiFetch(`${SUPPORT_CHAT_API_URL}/rooms/resume-notifications`, {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify({ roomId })
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Bật lại thông báo thất bại'));
  return await safeJson(res);
};

export const markSupportRoomRead = async ({ roomId, readerRole }) => {
  const res = await apiFetch(`${SUPPORT_CHAT_API_URL}/rooms/mark-read`, {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify({ roomId, readerRole })
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, 'Đánh dấu đã đọc thất bại'));
  return await safeJson(res);
};

