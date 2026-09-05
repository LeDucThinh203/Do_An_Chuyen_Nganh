// src/view/Product/AddProduct.js
import React, { useState, useEffect } from "react";
import { createProduct, getAllCategories } from "../../api";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ProductFormSkeleton } from "../common/Skeletons";

export default function AddProduct() {
  const [product, setProduct] = useState({
    name: "",
    price: "",
    description: "",
    category_id: "",
    imageFile: null,
    imagePreview: "",
  });
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || "/admin";
  const activeTab = location.state?.activeTab;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await getAllCategories();
      setCategories(data);
      if (data.length > 0) {
        setProduct((prev) => ({ ...prev, category_id: data[0].id }));
      }
    } catch (err) {
      console.error("Lỗi tải danh mục:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleAdd = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    if (!product.name || !product.price || !product.category_id) {
      setErrorMsg("Vui lòng điền đầy đủ tên sản phẩm, giá bán và chọn danh mục!");
      return;
    }

    let imagePath = "";
    if (product.imageFile) {
      imagePath = `/images/${product.imageFile.name}`;
    }

    const newProduct = {
      name: product.name,
      price: parseFloat(product.price),
      description: product.description,
      image: imagePath,
      category_id: parseInt(product.category_id),
    };

    try {
      setSubmitting(true);
      const res = await createProduct(newProduct);
      if (res) {
        alert("✅ Thêm sản phẩm thể thao mới thành công!");
        navigate(returnTo, activeTab ? { state: { activeTab } } : undefined);
      } else {
        setErrorMsg("Lỗi khi thêm sản phẩm, vui lòng kiểm tra lại!");
      }
    } catch (error) {
      console.error("Lỗi thêm sản phẩm:", error);
      if (error.message.includes("403") || error.message.includes("admin")) {
        setErrorMsg("Bạn cần đăng nhập với tài khoản Admin có thẩm quyền để thêm sản phẩm!");
      } else if (error.message.includes("401") || error.message.includes("token")) {
        setErrorMsg("Phiên đăng nhập hết hạn! Vui lòng đăng nhập lại.");
      } else {
        setErrorMsg("Lỗi: " + error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCategories) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <ProductFormSkeleton containerClassName="max-w-4xl mx-auto" />
      </div>
    );
  }

  const selectedCategoryName =
    categories.find((c) => String(c.id) === String(product.category_id))?.name || "Chưa chọn";

  return (
    <div className="min-h-screen bg-slate-100/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <Link to="/admin" className="hover:text-blue-600 transition">
                Quản trị hệ thống
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-bold">Thêm sản phẩm</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>➕</span>
              <span>Thêm Sản Phẩm Mới</span>
            </h1>
          </div>

          <button
            type="button"
            onClick={() => navigate(returnTo, activeTab ? { state: { activeTab } } : undefined)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition w-fit"
          >
            <span>←</span>
            <span>Quay lại danh sách</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleAdd} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Form Fields */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span>📝</span>
              <span>Thông tin cơ bản</span>
            </h2>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Tên sản phẩm thể thao *
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Áo Bóng Đá CLB Real Madrid 2026 Bản Đấu..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition font-medium"
                value={product.name}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Giá bán (VNĐ) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Ví dụ: 180000"
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition font-bold"
                    value={product.price}
                    onChange={(e) => setProduct({ ...product, price: e.target.value })}
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ₫
                  </span>
                </div>
                {product.price && !isNaN(product.price) && (
                  <p className="text-xs text-blue-600 font-semibold mt-1">
                    ≈ {Number(product.price).toLocaleString("vi-VN")} ₫
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Danh mục sản phẩm *
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition font-medium"
                  value={product.category_id}
                  onChange={(e) => setProduct({ ...product, category_id: e.target.value })}
                  required
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Mô tả chi tiết sản phẩm
              </label>
              <textarea
                rows="5"
                placeholder="Nhập thông tin về chất liệu, công nghệ thoáng khí, hướng dẫn bảo quản..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition leading-relaxed"
                value={product.description}
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
              />
            </div>
          </div>

          {/* Right Sidebar: Image & Actions */}
          <div className="lg:col-span-4 space-y-6">
            {/* Image Box */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>🖼️</span>
                <span>Hình ảnh sản phẩm</span>
              </h2>

              <div className="relative border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-4 text-center transition bg-slate-50/50">
                {product.imagePreview ? (
                  <div className="space-y-3">
                    <img
                      src={product.imagePreview}
                      alt="preview"
                      className="w-full h-48 object-cover rounded-xl shadow-md mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() => setProduct({ ...product, imageFile: null, imagePreview: "" })}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 py-1 px-3 rounded-lg hover:bg-rose-50 transition"
                    >
                      Xóa ảnh này
                    </button>
                  </div>
                ) : (
                  <div className="py-6 space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">
                      📷
                    </div>
                    <p className="text-xs font-bold text-slate-700">Tải ảnh sản phẩm lên</p>
                    <p className="text-[11px] text-slate-400">Định dạng PNG, JPG, WEBP</p>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setProduct({
                        ...product,
                        imageFile: file,
                        imagePreview: URL.createObjectURL(file),
                      });
                    }
                  }}
                />
              </div>
            </div>

            {/* Quick Live Preview */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-2 text-xs">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>👁️</span>
                <span>Xem trước thông số</span>
              </h3>
              <div className="p-3 rounded-xl bg-slate-50 space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>Tên:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[150px]">
                    {product.name || "(Chưa nhập)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Giá:</span>
                  <span className="font-bold text-blue-600">
                    {product.price ? `${Number(product.price).toLocaleString("vi-VN")} ₫` : "0 ₫"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Danh mục:</span>
                  <span className="font-semibold text-slate-800">{selectedCategoryName}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01]"
              >
                {submitting ? (
                  <span>Đang lưu sản phẩm...</span>
                ) : (
                  <>
                    <span>Tạo Sản Phẩm Mới</span>
                    <span>✨</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate(returnTo, activeTab ? { state: { activeTab } } : undefined)}
                className="w-full py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
