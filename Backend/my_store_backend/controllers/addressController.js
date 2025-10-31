import * as addressRepo from '../repositories/addressRepository.js';

export const getAllAddresses = async (req, res) => {
  try {
    const addresses = await addressRepo.getAllAddresses();
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAddressById = async (req, res) => {
  try {
    const address = await addressRepo.getAddressById(req.params.id);
    res.json(address);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createAddress = async (req, res) => {
  try {
    const id = await addressRepo.createAddress(req.body);
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateAddress = async (req, res) => {
  try {
    await addressRepo.updateAddress(req.params.id, req.body);
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    await addressRepo.deleteAddress(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
