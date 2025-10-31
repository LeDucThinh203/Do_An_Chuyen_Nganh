import * as sizeRepo from '../repositories/sizeRepository.js';

export const getAllSizes = async (req, res) => {
  try {
    const sizes = await sizeRepo.getAllSizes();
    res.json(sizes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSizeById = async (req, res) => {
  try {
    const size = await sizeRepo.getSizeById(req.params.id);
    res.json(size);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createSize = async (req, res) => {
  try {
    const id = await sizeRepo.createSize(req.body);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSize = async (req, res) => {
  try {
    await sizeRepo.updateSize(req.params.id, req.body);
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteSize = async (req, res) => {
  try {
    await sizeRepo.deleteSize(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
