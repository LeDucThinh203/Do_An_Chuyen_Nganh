import React, { useEffect, useState } from "react";
import { getAllCategories, deleteCategory } from "../../../api";
import CategoryForm from "./CategoryForm";

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const data = await getAllCategories();
    setCategories(data);
  };

  const handleDelete = async (id) => {
    if (window.confirm("🗑️ Bạn có chắc muốn xóa danh mục này?")) {
      await deleteCategory(id);
      setCategories(categories.filter((c) => c.id !== id));
    }
  };

  const handleEdit = (id) => {
    setEditId(id);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditId(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    fetchCategories();
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      {!showForm && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-4xl font-bold text-gray-800">Quản lý danh mục</h1>
            <button
              onClick={handleAdd}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full shadow-md transition-all"
            >
              + Thêm danh mục
            </button>
          </div>

          {/* Danh sách */}
          {categories.length === 0 ? (
            <div className="text-center py-20 text-gray-400 text-lg font-medium">
              Chưa có danh mục nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl shadow-lg p-5 flex flex-col justify-between hover:shadow-2xl transition-shadow duration-300"
                >
                  <div>
                    {/* Tên danh mục */}
                    <h2 className="text-lg font-semibold text-gray-800 truncate">
                      {cat.name}
                    </h2>
                    {/* Mô tả */}
                    <p className="text-gray-500 mt-2 line-clamp-3 text-sm">
                      <span className="font-medium">Mô tả: </span>
                      {cat.description || "Chưa có mô tả"}
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleEdit(cat.id)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-full shadow-sm transition-all text-sm"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-full shadow-sm transition-all text-sm"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Form thêm/sửa */}
      {showForm && <CategoryForm id={editId} onClose={handleFormClose} />}
    </div>
  );
}
