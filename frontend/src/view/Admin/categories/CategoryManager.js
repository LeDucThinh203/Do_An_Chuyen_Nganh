import React, { useEffect, useState } from "react";
import { getAllCategories, deleteCategory } from "../../../api";
import CategoryForm from "./CategoryForm";
import { AdminPanelSkeleton } from "../../common/Skeletons";

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getAllCategories();
      setCategories(data);
    } finally {
      setLoading(false);
    }
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
    <div className="max-w-7xl mx-auto space-y-6">
      {!showForm && (
        <>
          {/* Header Action Bar */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Danh Sách Danh Mục Hàng Hóa</h2>
              <p className="text-xs text-slate-500 mt-1">Phân loại danh mục cho toàn bộ sản phẩm trên cửa hàng</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">
                {categories.length} Danh mục
              </span>
              <button
                onClick={handleAdd}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/25 hover:shadow-lg transition-all flex items-center gap-1.5"
              >
                <span>➕</span>
                <span>Thêm Danh Mục Mới</span>
              </button>
            </div>
          </div>

          {/* Danh sách categories */}
          {loading ? (
            <AdminPanelSkeleton cardCount={6} />
          ) : categories.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8">
              <div className="text-4xl mb-3">🏷️</div>
              <p className="text-slate-600 font-bold">Chưa có danh mục sản phẩm nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between hover:border-blue-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">
                        🏷️
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        ID: #{cat.id}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 truncate mb-1.5">
                      {cat.name}
                    </h3>
                    <p className="text-slate-500 text-xs line-clamp-3 leading-relaxed">
                      {cat.description || "Chưa có mô tả chi tiết cho danh mục này."}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(cat.id)}
                      className="flex-1 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold py-2 rounded-xl border border-slate-200 text-xs transition"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs transition"
                      title="Xóa danh mục"
                    >
                      🗑️
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
