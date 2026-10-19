import * as categoryRepo from '../repositories/categoryRepository.js';
import { getOrSetCache, invalidateCacheNamespaces } from '../services/cache.js';

export const getAllCategories = async (req, res) => {
  try {
    const categories = await getOrSetCache('categories', 'all', 300, () => categoryRepo.getAllCategories());
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await getOrSetCache('category_item', req.params.id, 300, () => categoryRepo.getCategoryById(req.params.id));
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const id = await categoryRepo.createCategory(req.body);
    await invalidateCacheNamespaces('categories', 'category_item', 'products', 'admin_products', 'storefront');
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    await categoryRepo.updateCategory(req.params.id, req.body);
    await invalidateCacheNamespaces('categories', 'category_item', 'products', 'admin_products', 'storefront');
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    await categoryRepo.deleteCategory(req.params.id);
    await invalidateCacheNamespaces('categories', 'category_item', 'products', 'admin_products', 'storefront');
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
