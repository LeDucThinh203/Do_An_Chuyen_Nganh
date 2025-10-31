import * as productSizesRepo from '../repositories/productSizesRepository.js';

export const getAllProductSizes = async (req, res) => {
  try {
    const productSizes = await productSizesRepo.getAllProductSizes();
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
    res.status(500).json({ error: err.message });
  }
};

export const updateProductSize = async (req, res) => {
  try {
    await productSizesRepo.updateProductSize(req.params.id, req.body);
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteProductSize = async (req, res) => {
  try {
    await productSizesRepo.deleteProductSize(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
