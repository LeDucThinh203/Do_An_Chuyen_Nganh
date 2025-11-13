import React, { useState, useEffect } from "react";
import { getCategoryById, createCategory, updateCategory } from "../../../api";

export default function CategoryForm({ id, onClose }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (id) fetchCategory();
  }, [id]);

  const fetchCategory = async () => {
    const cat = await getCategoryById(id);
    if (cat) {
      setName(cat.name);
      setDescription(cat.description);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Tên danh mục không được để trống!");

    if (id) {
      await updateCategory(id, { name, description });
      alert("Cập nhật danh mục thành công!");
    } else {
      await createCategory({ name, description });
      alert("Thêm danh mục thành công!");
    }

    onClose(); // đóng form và refresh list
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start sm:items-center justify-center z-50 overflow-auto py-10">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-4xl p-8 mx-4 sm:mx-0">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          {id ? "Sửa danh mục" : "Thêm danh mục"}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block font-medium mb-1 text-gray-700">Tên danh mục</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block font-medium mb-1 text-gray-700">Mô tả</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows="4"
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition"
            >
              {id ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
