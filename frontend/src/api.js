// ================= Product API =================
const PRODUCT_API_URL = "http://localhost:3006/product";

export const getAllProducts = async () => {
  const res = await fetch(PRODUCT_API_URL);
  if (!res.ok) throw new Error("Lấy sản phẩm thất bại");
  return await res.json();
};

export const deleteProduct = async (id) => {
  const res = await fetch(`${PRODUCT_API_URL}/${id}`, { method: "DELETE" });
  return res.ok;
};

export const updateProduct = async (id, data) => {
  const res = await fetch(`${PRODUCT_API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Cập nhật sản phẩm thất bại");
  return await res.json();
};

export const createProduct = async (data) => {
  const res = await fetch(PRODUCT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Tạo sản phẩm thất bại");
  return await res.json();
};

// ================= Category API =================
const CATEGORY_API_URL = "http://localhost:3006/category";

export const getAllCategories = async () => {
  const res = await fetch(CATEGORY_API_URL);
  if (!res.ok) throw new Error("Lấy danh mục thất bại");
  return await res.json();
};

export const getCategoryById = async (id) => {
  const res = await fetch(`${CATEGORY_API_URL}/${id}`);
  if (!res.ok) throw new Error("Lấy danh mục thất bại");
  return await res.json();
};

export const createCategory = async (data) => {
  const res = await fetch(CATEGORY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Tạo danh mục thất bại");
  return await res.json();
};

export const updateCategory = async (id, data) => {
  const res = await fetch(`${CATEGORY_API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Cập nhật danh mục thất bại");
  return await res.json();
};

export const deleteCategory = async (id) => {
  const res = await fetch(`${CATEGORY_API_URL}/${id}`, { method: "DELETE" });
  return res.ok;
};

// ================= Account API =================
const ACCOUNT_API_URL = "http://localhost:3006/account";

export const login = async ({ email, password }) => {
  const res = await fetch(`${ACCOUNT_API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Email hoặc mật khẩu không đúng");
  }
  return await res.json();
};

export const register = async ({ email, username, password, role = "user" }) => {
  const res = await fetch(`${ACCOUNT_API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Đăng ký thất bại" }));
    throw new Error(err.error || "Đăng ký thất bại");
  }
  return await res.json();
};

export const getAllAccounts = async () => {
  const res = await fetch(ACCOUNT_API_URL);
  if (!res.ok) throw new Error("Lấy danh sách tài khoản thất bại");
  return await res.json();
};

export const getAccountById = async (id) => {
  const res = await fetch(`${ACCOUNT_API_URL}/${id}`);
  if (!res.ok) throw new Error("Lấy thông tin tài khoản thất bại");
  return await res.json();
};

export const updateAccount = async (id, data) => {
  const res = await fetch(`${ACCOUNT_API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Cập nhật tài khoản thất bại");
  return await res.json();
};

export const deleteAccount = async (id) => {
  const res = await fetch(`${ACCOUNT_API_URL}/${id}`, { method: "DELETE" });
  return res.ok;
};

// ================= Address API =================
const ADDRESS_API_URL = "http://localhost:3006/address";

export const getAllAddresses = async () => {
  const res = await fetch(ADDRESS_API_URL);
  if (!res.ok) throw new Error("Lấy danh sách địa chỉ thất bại");
  return await res.json();
};

export const getAddressById = async (id) => {
  const res = await fetch(`${ADDRESS_API_URL}/${id}`);
  if (!res.ok) throw new Error("Lấy địa chỉ thất bại");
  return await res.json();
};

export const createAddress = async (data) => {
  const res = await fetch(ADDRESS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Tạo địa chỉ thất bại");
  return await res.json();
};

export const updateAddress = async (id, data) => {
  const res = await fetch(`${ADDRESS_API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Cập nhật địa chỉ thất bại");
  return await res.json();
};

export const deleteAddress = async (id) => {
  const res = await fetch(`${ADDRESS_API_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Xóa địa chỉ thất bại");
  return true;
};
