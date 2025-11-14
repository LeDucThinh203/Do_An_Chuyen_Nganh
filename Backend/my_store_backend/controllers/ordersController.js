import * as ordersRepo from '../repositories/ordersRepository.js';

export const getAllOrders = async (req, res) => {
  try {
    const orders = await ordersRepo.getAllOrders();
    res.json(orders);
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
    if (!isAdmin && order.account_id !== userId) {
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
