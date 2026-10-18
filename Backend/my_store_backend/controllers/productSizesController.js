import * as productSizesRepo from '../repositories/productSizesRepository.js';

export const getAllProductSizes = async (req, res) => {
  try {
    let productIds = req.query.product_ids
      ? String(req.query.product_ids).split(',').map((id) => id.trim())
      : req.query.product_id ?? null;
    if (Array.isArray(productIds) && (productIds.length > 100 || productIds.some((id) => !/^\d+$/.test(id)))) {
      return res.status(400).json({ error: 'Danh sách product_id không hợp lệ' });
    }
    if (typeof productIds === 'string' && !/^\d+$/.test(productIds)) {
      return res.status(400).json({ error: 'product_id không hợp lệ' });
    }
    const productSizes = await productSizesRepo.getAllProductSizes(productIds);
    res.json(productSizes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProductSizeById = async (req, res) => {
  try {
    const productSize = await productSizesRepo.getProductSizeById(req.params.id);
    res.json(productSize);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createProductSize = async (req, res) => {
  try {
    const id = await productSizesRepo.createProductSize(req.body);
    res.status(201).json({ id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Size này đã được gán cho sản phẩm' });
    }
    res.status(500).json({ error: err.message });
  }
};

export const updateProductSize = async (req, res) => {
  try {
    await productSizesRepo.updateProductSize(req.params.id, req.body);
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Kết hợp sản phẩm/size đã tồn tại' });
    }
    res.status(500).json({ error: err.message });
  }
};

export const deleteProductSize = async (req, res) => {
  try {
    await productSizesRepo.deleteProductSize(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ error: 'Không thể xóa vì size này đã có trong đơn hàng' });
    }
    res.status(500).json({ error: err.message });
  }
};
