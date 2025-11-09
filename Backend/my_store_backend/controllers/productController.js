import * as productRepo from '../repositories/productRepository.js';

export const getAllProducts = async (req, res) => {
  try {
    const products = await productRepo.getAllProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await productRepo.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const id = await productRepo.createProduct(req.body);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    await productRepo.updateProduct(req.params.id, req.body);
    res.json({ message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    await productRepo.deleteProduct(req.params.id);
    res.json({ message: 'Xóa thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
