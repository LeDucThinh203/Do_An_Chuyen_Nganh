import * as ratingRepo from '../repositories/ratingRepository.js';

export const getAllRatings = async (req, res) => {
  try {
    const ratings = await ratingRepo.getAllRatings();
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRatingById = async (req, res) => {
  try {
    const rating = await ratingRepo.getRatingById(req.params.id);
    res.json(rating);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createRating = async (req, res) => {
  try {
    const id = await ratingRepo.createRating(req.body);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateRating = async (req, res) => {
  try {
    await ratingRepo.updateRating(req.params.id, req.body);
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteRating = async (req, res) => {
  try {
    await ratingRepo.deleteRating(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
