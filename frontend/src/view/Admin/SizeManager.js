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
      setMessage("⚠️ Vui lòng nhập tên kích cỡ (Size).");
      return;
    }

    try {
      await createSize({ size: value });
      setNewSize("");
      setMessage(`✅ Đã thêm size ${value} thành công.`);
      await fetchSizes();
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setMessage(`❌ Thêm size thất bại: ${err.message}`);
      setTimeout(() => setMessage(""), 4000);
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
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setMessage(`❌ Cập nhật size thất bại: ${err.message}`);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const handleDelete = async (id, sizeName) => {
    if (!window.confirm(`Bạn có chắc muốn xóa size "${sizeName}" không?`)) return;

    try {
      await deleteSize(id);
      setMessage(`🗑️ Đã xóa size ${sizeName}.`);
      await fetchSizes();
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setMessage(`❌ Xóa size thất bại: ${err.message}`);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Quản Lý Kích Cỡ Sản Phẩm (Size)</h2>
          <p className="text-xs text-slate-500 mt-1">Thiết lập các tiêu chuẩn kích cỡ (S, M, L, XL, 39, 40...) cho cửa hàng</p>
        </div>

        {/* Add Size Input */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Nhập tên size (VD: XXL, 42)..."
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48"
          />
          <button
            onClick={handleAdd}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-md shadow-blue-500/25 transition whitespace-nowrap"
          >
            ➕ Thêm
          </button>
        </div>
      </div>

      {/* Notification */}
      {message && (
        <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold">
          {message}
        </div>
      )}

      {/* Sizes List */}
      {loading ? (
        <AdminPanelSkeleton cardCount={4} />
      ) : sizes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8">
          <p className="text-slate-500 font-bold">Chưa có kích cỡ nào trong hệ thống.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {sizes.map((size) => {
            const isEditing = editing[size.id] !== undefined;
            return (
              <div
                key={size.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    ID: #{size.id}
                  </span>
                  <button
                    onClick={() => handleDelete(size.id, size.size)}
                    className="text-slate-400 hover:text-rose-600 transition text-xs p-1"
                    title="Xóa kích cỡ"
                  >
                    🗑️
                  </button>
                </div>

                <div className="text-center py-2">
                  <input
                    type="text"
                    value={editing[size.id] ?? size.size}
                    onChange={(e) =>
                      setEditing((prev) => ({
                        ...prev,
                        [size.id]: e.target.value,
                      }))
                    }
                    className="w-full text-center border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-xl py-2 text-xl font-black text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 uppercase"
                  />
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100">
                  {isEditing ? (
                    <button
                      onClick={() => handleSave(size.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded-xl text-xs transition"
                    >
                      Lưu thay đổi
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 text-center block">
                      Click để chỉnh sửa
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}