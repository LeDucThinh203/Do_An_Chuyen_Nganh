import React, { useEffect, useState } from "react";
import { createSize, deleteSize, getAllSizes, updateSize } from "../../api";
import { AdminPanelSkeleton } from "../common/Skeletons";

export default function SizeManager() {
  const [sizes, setSizes] = useState([]);
  const [newSize, setNewSize] = useState("");
  const [editing, setEditing] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSizes();
  }, []);

  const fetchSizes = async () => {
    try {
      setLoading(true);
      const data = await getAllSizes();
      setSizes(data);
    } catch (err) {
      setMessage(`❌ Không thể tải danh sách size: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const value = newSize.trim();
    if (!value) {
      setMessage("⚠️ Vui lòng nhập tên size.");
      return;
    }

    try {
      await createSize({ size: value });
      setNewSize("");
      setMessage(`✅ Đã thêm size ${value}.`);
      await fetchSizes();
    } catch (err) {
      setMessage(`❌ Thêm size thất bại: ${err.message}`);
    }
  };

  const handleSave = async (id) => {
    const value = (editing[id] ?? "").trim();
    if (!value) {
      setMessage("⚠️ Tên size không được để trống.");
      return;
    }

    try {
      await updateSize(id, { size: value });
      setEditing((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setMessage(`✅ Đã cập nhật size thành ${value}.`);
      await fetchSizes();
    } catch (err) {
      setMessage(`❌ Cập nhật size thất bại: ${err.message}`);
    }
  };

  const handleDelete = async (id, sizeName) => {
    if (!window.confirm(`Bạn có chắc muốn xóa size "${sizeName}" không?`)) return;

    try {
      await deleteSize(id);
      setMessage(`🗑️ Đã xóa size ${sizeName}.`);
      await fetchSizes();
    } catch (err) {
      setMessage(`❌ Xóa size thất bại: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8 bg-white rounded-2xl shadow-lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quản lý size</h1>
          <p className="text-gray-500 mt-1">Thêm, sửa, xóa size dùng chung cho sản phẩm.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            placeholder="Nhập size mới"
            className="border border-gray-300 rounded-full px-4 py-2 min-w-56 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleAdd}
            className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-full shadow-md transition-all"
          >
            + Thêm size
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-700">
          {message}
        </div>
      )}

      {loading ? (
        <AdminPanelSkeleton cardCount={4} />
      ) : sizes.length === 0 ? (
        <p className="text-center text-gray-400 py-12">Chưa có size nào.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sizes.map((size) => (
            <div key={size.id} className="border rounded-2xl p-4 shadow-sm bg-gray-50">
              <div className="text-xs text-gray-500 mb-2">ID: {size.id}</div>
              <input
                type="text"
                value={editing[size.id] ?? size.size}
                onChange={(e) =>
                  setEditing((prev) => ({
                    ...prev,
                    [size.id]: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg font-semibold bg-white"
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleSave(size.id)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-full text-sm"
                >
                  Lưu
                </button>
                <button
                  onClick={() => handleDelete(size.id, size.size)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-full text-sm"
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