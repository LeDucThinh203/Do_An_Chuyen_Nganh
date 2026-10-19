import * as sizeRepo from '../repositories/sizeRepository.js';
import { getOrSetCache, invalidateCacheNamespaces } from '../services/cache.js';

export const getAllSizes = async (req, res) => {
  try {
    const sizes = await getOrSetCache('sizes', 'all', 300, () => sizeRepo.getAllSizes());
    res.json(sizes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSizeById = async (req, res) => {
  try {
    const size = await getOrSetCache('size_item', req.params.id, 300, () => sizeRepo.getSizeById(req.params.id));
    res.json(size);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createSize = async (req, res) => {
  try {
    const id = await sizeRepo.createSize(req.body);
    await invalidateCacheNamespaces('sizes', 'size_item', 'inventory', 'inventory_item', 'products', 'storefront', 'product_details', 'admin_products');
    res.status(201).json({ id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Size đã tồn tại' });
    }
    res.status(500).json({ error: err.message });
  }
};

export const updateSize = async (req, res) => {
  try {
    await sizeRepo.updateSize(req.params.id, req.body);
    await invalidateCacheNamespaces('sizes', 'size_item', 'inventory', 'inventory_item', 'products', 'storefront', 'product_details', 'admin_products');
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Size đã tồn tại' });
    }
    res.status(500).json({ error: err.message });
  }
};

export const deleteSize = async (req, res) => {
  try {
    await sizeRepo.deleteSize(req.params.id);
    await invalidateCacheNamespaces('sizes', 'size_item', 'inventory', 'inventory_item', 'products', 'storefront', 'product_details', 'admin_products');
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ error: 'Không thể xóa size vì đang được dùng trong sản phẩm' });
    }
    res.status(500).json({ error: err.message });
  }
};
