// src/api.js

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

// ================= AI Chat API =================
const AI_API_URL = "http://localhost:3006/ai";

export const aiChat = async ({ message, userId = null, sessionId = null, topK = 5, fast = false }) => {
  const res = await fetch(`${AI_API_URL}/chat`, {
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
  const res = await fetch(`${AI_API_URL}/history?sessionId=${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new Error('Lấy lịch sử chat thất bại');
  return await safeJson(res);
};
