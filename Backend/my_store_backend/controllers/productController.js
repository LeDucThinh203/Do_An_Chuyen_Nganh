import * as productRepo from '../repositories/productRepository.js';
import * as ratingRepo from '../repositories/ratingRepository.js';
import { decodeCursor, parseLimit } from '../utils/pagination.js';

const getPageOptions = (req) => {
  const cursor = decodeCursor(req.query.cursor);
  if (req.query.cursor && (!cursor || !Number.isInteger(Number(cursor.id)) || Number(cursor.id) < 1)) {
    const err = new Error('Cursor phan trang khong hop le');
    err.statusCode = 400;
    throw err;
  }
  return {
    limit: parseLimit(req.query.limit),
    cursor,
    categoryId: req.query.category_id || null,
  };
};

const hasPagination = (req) => req.query.limit !== undefined || req.query.cursor !== undefined;

export const getAllProducts = async (req, res) => {
  try {
    const result = hasPagination(req)
      ? await productRepo.getProductsPage(getPageOptions(req))
      : await productRepo.getAllProducts();
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

export const getAllProductsAdmin = async (req, res) => {
  try {
    const result = hasPagination(req)
      ? await productRepo.getProductsPage({ ...getPageOptions(req), includeDeleted: true })
      : await productRepo.getAllProducts({ includeDeleted: true });
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

export const getProductRatings = async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit, 20);
    const cursor = decodeCursor(req.query.cursor);
    if (req.query.cursor && (!cursor || !Number.isInteger(Number(cursor.id)) || Number(cursor.id) < 1)) {
      return res.status(400).json({ error: 'Cursor phan trang khong hop le' });
    }
    const result = await ratingRepo.getProductRatingsPage(req.params.id, {
      limit,
      cursor,
    });
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

export const getProductRatingEligibility = async (req, res) => {
  try {
    const orderDetailId = await ratingRepo.getEligibleOrderDetailId(req.params.id, req.user.id);
    res.json({ order_detail_id: orderDetailId });
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
    res.json({ message: 'Ẩn sản phẩm thành công' });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
};

export const restoreProduct = async (req, res) => {
  try {
    await productRepo.restoreProduct(req.params.id);
    res.json({ message: 'Khôi phục sản phẩm thành công' });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
};

export const hardDeleteProduct = async (req, res) => {
  try {
    await productRepo.hardDeleteProduct(req.params.id);
    res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
};
