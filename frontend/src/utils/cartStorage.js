export const CART_UPDATED_EVENT = "coolshop:cart-updated";

export const readCart = () => {
  try {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
};

export const getCartItemCount = () =>
  readCart().reduce((sum, item) => sum + Number(item?.quantity || 1), 0);

export const writeCart = (cart) => {
  localStorage.setItem("cart", JSON.stringify(Array.isArray(cart) ? cart : []));
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
};

export const clearCart = () => {
  localStorage.removeItem("cart");
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
};
