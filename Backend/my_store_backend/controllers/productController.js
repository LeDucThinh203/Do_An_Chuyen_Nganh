import * as productRepo from '../repositories/productRepository.js';
import * as productSizesRepo from '../repositories/productSizesRepository.js';
import * as ratingRepo from '../repositories/ratingRepository.js';
import * as categoryRepo from '../repositories/categoryRepository.js';
import { decodeCursor, parseLimit } from '../utils/pagination.js';
import { getOrSetCache, invalidateCacheNamespaces } from '../services/cache.js';

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

export const getStorefrontPage = async (req, res) => {
  try {
    const options = getPageOptions(req);
    const [page, categories] = await Promise.all([
      getOrSetCache('storefront', JSON.stringify(options), 20, () => productRepo.getProductsPage(options)),
      getOrSetCache('categories', 'all', 300, () => categoryRepo.getAllCategories()),
    ]);
    res.json({ ...page, categories });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const options = hasPagination(req) ? getPageOptions(req) : null;
    const result = await getOrSetCache(
      'products',
      JSON.stringify(options || { all: true }),
      options ? 20 : 30,
      () => options ? productRepo.getProductsPage(options) : productRepo.getAllProducts()
    );
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

export const getAllProductsAdmin = async (req, res) => {
  try {
    const options = hasPagination(req) ? { ...getPageOptions(req), includeDeleted: true } : null;
    const result = await getOrSetCache(
      'admin_products',
      JSON.stringify(options || { all: true }),
      options ? 10 : 15,
      () => options ? productRepo.getProductsPage(options) : productRepo.getAllProducts({ includeDeleted: true })
    );
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
    const options = {
      limit,
      cursor,
    };
    const result = await getOrSetCache(
      'product_ratings',
      JSON.stringify({ productId: req.params.id, ...options }),
      30,
      () => ratingRepo.getProductRatingsPage(req.params.id, options)
    );
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
    const product = await getOrSetCache(
      'product_details',
      req.params.id,
      10,
      () => productRepo.getProductById(req.params.id)
    );
    if (!product) return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProductDetails = async (req, res) => {
  try {
    const result = await getOrSetCache('product_details', `${req.params.id}:with-sizes`, 8, async () => {
      const [product, productSizes] = await Promise.all([
        productRepo.getProductById(req.params.id),
        productSizesRepo.getAllProductSizes(req.params.id),
      ]);
      return { product, productSizes };
    });
    const { product, productSizes } = result;
    if (!product) return res.status(404).json({ error: 'Sáº£n pháº©m khĂ´ng tá»“n táº¡i' });
    res.json({ product, productSizes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const id = await productRepo.createProduct(req.body);
    await invalidateCacheNamespaces('products', 'admin_products', 'storefront', 'product_details', 'inventory', 'inventory_item');
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    await productRepo.updateProduct(req.params.id, req.body);
    await invalidateCacheNamespaces('products', 'admin_products', 'storefront', 'product_details', 'inventory', 'inventory_item');
    res.json({ message: 'Cập nhật thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    await productRepo.deleteProduct(req.params.id);
    await invalidateCacheNamespaces('products', 'admin_products', 'storefront', 'product_details', 'inventory', 'inventory_item');
    res.json({ message: 'Ẩn sản phẩm thành công' });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
};

export const restoreProduct = async (req, res) => {
  try {
    await productRepo.restoreProduct(req.params.id);
    await invalidateCacheNamespaces('products', 'admin_products', 'storefront', 'product_details', 'inventory', 'inventory_item');
    res.json({ message: 'Khôi phục sản phẩm thành công' });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
};

export const hardDeleteProduct = async (req, res) => {
  try {
    await productRepo.hardDeleteProduct(req.params.id);
    await invalidateCacheNamespaces('products', 'admin_products', 'storefront', 'product_details', 'inventory', 'inventory_item');
    res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message });
  }
};
