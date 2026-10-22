import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Session from '../Session/session';
import {
  addMyCartItem,
  clearMyCart,
  getMyCart,
  mergeMyCart,
  removeMyCartItem,
  updateMyCartItem,
} from '../api';
import { clearGuestCart, readCart, writeCart } from '../utils/cartStorage';

const CartContext = createContext(null);
const guestMergeRequests = new Map();

const getGuestMergeRequest = (accountId, items) => {
  const key = String(accountId);
  if (guestMergeRequests.has(key)) return guestMergeRequests.get(key);

  const request = mergeMyCart(items.map((item) => ({
    product_id: item.id,
    size: item.size,
    quantity: Number(item.quantity || 1),
  })))
    .then((result) => {
      clearGuestCart();
      return result;
    })
    .finally(() => guestMergeRequests.delete(key));

  guestMergeRequests.set(key, request);
  return request;
};

const countItems = (items) => items.reduce((sum, item) => sum + Number(item?.quantity || 0), 0);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);
  const loadedAccountId = useRef(undefined);

  const refreshCart = useCallback(async () => {
    const version = ++requestVersion.current;
    const accountId = Session.getAccountId();
    if (String(loadedAccountId.current ?? '') !== String(accountId ?? '')) {
      loadedAccountId.current = accountId;
      setItems([]);
    }
    setLoading(true);
    setError('');

    try {
      let nextItems;
      if (accountId) {
        const guestItems = readCart();
        if (guestItems.length) await getGuestMergeRequest(accountId, guestItems);
        const result = await getMyCart();
        nextItems = Array.isArray(result?.cart) ? result.cart : [];
      } else {
        nextItems = readCart();
      }

      if (version === requestVersion.current) setItems(nextItems);
      return nextItems;
    } catch (refreshError) {
      if (version === requestVersion.current) setError(refreshError.message || 'Không thể tải giỏ hàng.');
      throw refreshError;
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const syncCart = () => refreshCart().catch(() => {});
    window.addEventListener(Session.AUTH_CHANGED_EVENT, syncCart);
    syncCart();
    return () => {
      requestVersion.current += 1;
      window.removeEventListener(Session.AUTH_CHANGED_EVENT, syncCart);
    };
  }, [refreshCart]);

  const addItem = useCallback(async (item, quantity = 1) => {
    const accountId = Session.getAccountId();
    if (accountId) {
      const result = await addMyCartItem({ product_sizes_id: item.product_sizes_id, quantity });
      const nextItems = Array.isArray(result?.cart) ? result.cart : await getMyCart().then((data) => data.cart || []);
      setItems(nextItems);
      setError('');
      return nextItems;
    }

    const guestItems = readCart();
    const existing = guestItems.find((entry) => String(entry.id) === String(item.id) && String(entry.size || '') === String(item.size || ''));
    const nextQuantity = Number(existing?.quantity || 0) + Number(quantity);
    const stock = Number(item.stock ?? existing?.stock ?? Number.MAX_SAFE_INTEGER);
    if (!Number.isSafeInteger(nextQuantity) || nextQuantity < 1 || nextQuantity > stock) {
      throw new Error(`Số lượng vượt quá tồn kho hiện tại (${stock}).`);
    }

    const nextItems = existing
      ? guestItems.map((entry) => entry === existing ? { ...entry, ...item, quantity: nextQuantity } : entry)
      : [...guestItems, { ...item, quantity: Number(quantity) }];
    writeCart(nextItems);
    setItems(nextItems);
    setError('');
    return nextItems;
  }, []);

  const updateQuantity = useCallback(async (item, quantity) => {
    const accountId = Session.getAccountId();
    if (accountId) {
      const result = await updateMyCartItem(item.product_sizes_id, quantity);
      const nextItems = Array.isArray(result?.cart) ? result.cart : [];
      setItems(nextItems);
      return nextItems;
    }

    const nextItems = readCart().map((entry) => (
      String(entry.id) === String(item.id) && String(entry.size || '') === String(item.size || '')
        ? { ...entry, quantity }
        : entry
    ));
    writeCart(nextItems);
    setItems(nextItems);
    return nextItems;
  }, []);

  const removeItem = useCallback(async (item) => {
    const accountId = Session.getAccountId();
    if (accountId) {
      const result = await removeMyCartItem(item.product_sizes_id);
      const nextItems = Array.isArray(result?.cart) ? result.cart : [];
      setItems(nextItems);
      return nextItems;
    }

    const nextItems = readCart().filter((entry) => !(
      String(entry.id) === String(item.id) && String(entry.size || '') === String(item.size || '')
    ));
    writeCart(nextItems);
    setItems(nextItems);
    return nextItems;
  }, []);

  const clear = useCallback(async () => {
    if (Session.getAccountId()) {
      await clearMyCart();
      setItems([]);
    } else {
      clearGuestCart();
      setItems([]);
    }
  }, []);

  const resetAfterOrder = useCallback((purchasedSizeIds = []) => {
    const purchasedIds = new Set(purchasedSizeIds.map(String));
    setItems((current) => current.filter((item) => !purchasedIds.has(String(item.product_sizes_id))));
    if (!Session.getAccountId()) {
      const remaining = readCart().filter((item) => !purchasedIds.has(String(item.product_sizes_id)));
      writeCart(remaining);
    } else {
      refreshCart().catch(() => {});
    }
  }, [refreshCart]);

  const value = useMemo(() => ({
    items,
    count: countItems(items),
    loading,
    error,
    refreshCart,
    addItem,
    updateQuantity,
    removeItem,
    clear,
    resetAfterOrder,
  }), [items, loading, error, refreshCart, addItem, updateQuantity, removeItem, clear, resetAfterOrder]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider.');
  return context;
}
