import * as orderDetailsRepo from '../repositories/orderDetailsRepository.js';

export const getAllOrderDetails = async (req, res) => {
  try {
    const orderDetails = await orderDetailsRepo.getAllOrderDetails();
    res.json(orderDetails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getOrderDetailById = async (req, res) => {
  try {
    const orderDetail = await orderDetailsRepo.getOrderDetailById(req.params.id);
    res.json(orderDetail);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createOrderDetail = async (req, res) => {
  try {
    const id = await orderDetailsRepo.createOrderDetail(req.body);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateOrderDetail = async (req, res) => {
  try {
    await orderDetailsRepo.updateOrderDetail(req.params.id, req.body);
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteOrderDetail = async (req, res) => {
  try {
    await orderDetailsRepo.deleteOrderDetail(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
