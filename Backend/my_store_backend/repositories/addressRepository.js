import db from '../db.js';

export const getAllAddresses = async () => {
  const [rows] = await db.query('SELECT * FROM address');
  return rows;
};

export const getAddressById = async (id) => {
  const [rows] = await db.query('SELECT * FROM address WHERE id=?', [id]);
  return rows[0] || null;
};

export const createAddress = async (addressData) => {
  const { account_id, name, phone, provinceName, districtName, wardName, address_detail } = addressData;
  const [result] = await db.query(
    `INSERT INTO address 
    (account_id, name, phone, provinceName, districtName, wardName, address_detail) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [account_id, name, phone, provinceName, districtName, wardName, address_detail]
  );
  return result.insertId;
};

export const updateAddress = async (id, addressData) => {
  const { account_id, name, phone, provinceName, districtName, wardName, address_detail } = addressData;
  await db.query(
    `UPDATE address SET account_id=?, name=?, phone=?, provinceName=?, districtName=?, wardName=?, address_detail=? WHERE id=?`,
    [account_id, name, phone, provinceName, districtName, wardName, address_detail, id]
  );
};

export const deleteAddress = async (id) => {
  await db.query('DELETE FROM address WHERE id=?', [id]);
};
