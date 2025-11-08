import React, { useEffect, useState } from "react";
import { getAllCategories, deleteCategory } from "../../api";
import { Link } from "react-router-dom";

export default function CategoryList() {
  const [categories, setCategories] = useState([]);

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

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý danh mục</h1>
        <Link
          to="/categories/add"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
        >
          + Thêm danh mục
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          Chưa có danh mục nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-4 bg-white rounded shadow flex flex-col justify-between"
            >
              <h2 className="text-lg font-semibold">{cat.name}</h2>
              <p className="text-gray-500 mt-2 line-clamp-3">{cat.description}</p>
              <div className="mt-4 flex gap-2">
                <Link
                  to={`/categories/edit/${cat.id}`}
                  className="flex-1 text-center bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                >
                  Sửa
                </Link>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="flex-1 text-center bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
