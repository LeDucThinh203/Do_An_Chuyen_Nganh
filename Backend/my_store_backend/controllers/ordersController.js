import * as ordersRepo from '../repositories/ordersRepository.js';
import { decodeCursor, parseLimit } from '../utils/pagination.js';
import { invalidateCacheNamespaces } from '../services/cache.js';

const getPage = async (req, res, accountId = null) => {
  const cursor = decodeCursor(req.query.cursor);
  const cursorDate = cursor?.createdAt ? new Date(cursor.createdAt) : null;
  const fromDate = req.query.from ? new Date(req.query.from) : null;
  const toDate = req.query.to ? new Date(req.query.to) : null;
  if (req.query.cursor && (
    !cursor ||
    !Number.isInteger(Number(cursor.id)) || Number(cursor.id) < 1 ||
    !cursorDate || Number.isNaN(cursorDate.getTime())
  )) {
    return res.status(400).json({ error: 'Cursor phan trang khong hop le' });
  }
  if (
    Boolean(req.query.from) !== Boolean(req.query.to) ||
    (fromDate && Number.isNaN(fromDate.getTime())) ||
    (toDate && Number.isNaN(toDate.getTime())) ||
    (fromDate && toDate && fromDate >= toDate)
  ) {
    return res.status(400).json({ error: 'Khoang thoi gian khong hop le' });
  }
  const page = await ordersRepo.getOrdersPage({
    limit: parseLimit(req.query.limit),
    cursor,
    accountId,
    from: fromDate?.toISOString() || null,
    to: toDate?.toISOString() || null,
  });
  return res.json(page);
};

export const getAllOrders = async (req, res) => {
  try {
    if (
      req.query.limit !== undefined ||
      req.query.cursor !== undefined ||
      req.query.from !== undefined ||
      req.query.to !== undefined
    ) {
      return await getPage(req, res);
    }
    const orders = await ordersRepo.getAllOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMyOrdersPage = async (req, res) => {
  try {
    return await getPage(req, res, req.user.id);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await ordersRepo.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createOrder = async (req, res) => {
  try {
    const id = await ordersRepo.createOrder(req.body);
    await invalidateCacheNamespaces('inventory', 'inventory_item', 'storefront', 'product_details', 'admin_products');
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    await ordersRepo.updateOrderStatus(req.params.id, req.body);
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'admin';

    // Lấy thông tin đơn hàng
    const order = await ordersRepo.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }

    // Kiểm tra quyền: admin hoặc chủ đơn hàng
    if (!isAdmin && Number(order.account_id) !== Number(userId)) {
      return res.status(403).json({ error: 'Không có quyền hủy đơn hàng này' });
    }

    // User thường chỉ có thể hủy đơn pending
    if (!isAdmin && order.status !== 'pending') {
      return res.status(403).json({ error: 'Chỉ có thể hủy đơn hàng đang chờ xử lý' });
    }

    await ordersRepo.deleteOrder(orderId);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
