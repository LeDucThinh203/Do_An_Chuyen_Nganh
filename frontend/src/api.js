// api.js
const API_URL = "http://localhost:3006/product"; // hoặc URL backend của bạn

export const getAllProducts = async () => {
  const res = await fetch(API_URL);
  return await res.json();
};

export const deleteProduct = async (id) => {
  const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  return res.ok;
};

export const updateProduct = async (id, data) => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.ok ? await res.json() : null;
};

// ✅ Thêm createProduct
export const createProduct = async (data) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.ok ? await res.json() : null;
};
