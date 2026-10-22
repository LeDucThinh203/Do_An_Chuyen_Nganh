export const readCart = () => {
  try {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
};

export const writeCart = (cart) => {
  localStorage.setItem("cart", JSON.stringify(Array.isArray(cart) ? cart : []));
};

export const clearGuestCart = () => {
  localStorage.removeItem("cart");
};
