import React, { useState, useEffect } from "react";
import { getAllProducts, updateProduct, getAllCategories } from "../../api";
import { useParams, useNavigate } from "react-router-dom";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadProduct();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error("Lỗi tải danh mục:", error);
    }
  };

  const loadProduct = async () => {
    try {
      const data = await getAllProducts();
      const found = data.find((p) => p.id === parseInt(id));
      if (!found) {
        alert("❌ Không tìm thấy sản phẩm!");
        navigate("/");
      } else {
        setProduct({ 
          ...found, 
          imageFile: null, 
          newImagePreview: null 
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async () => {
    if (!product.name || !product.price || !product.category_id) {
      alert("⚠️ Vui lòng điền đầy đủ thông tin sản phẩm!");
      return;
    }

    let imagePath = product.image; // giữ ảnh cũ nếu không chọn mới
    if (product.imageFile) {
      imagePath = `/images/${product.imageFile.name}`;
    }

    const updated = {
      name: product.name,
      price: parseFloat(product.price),
      description: product.description,
      image: imagePath,
      category_id: parseInt(product.category_id),
    };

    try {
      const res = await updateProduct(id, updated);
      if (res) {
        alert("✅ Cập nhật sản phẩm thành công!");
        navigate("/");
      } else {
        alert("❌ Lỗi khi cập nhật sản phẩm!");
      }
    } catch (error) {
      console.error(error);
      alert("❌ Lỗi khi cập nhật sản phẩm!");
    }
  };

  if (!product) return <p className="text-center mt-10">Đang tải...</p>;

  return (
    <div className="max-w-5xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-700">
        Chỉnh sửa sản phẩm
      </h2>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Form thông tin sản phẩm */}
        <div className="flex-1 space-y-4">
          <input
            type="text"
            className="w-full border p-3 rounded mb-2"
            value={product.name}
            onChange={(e) => setProduct({ ...product, name: e.target.value })}
            placeholder="Tên sản phẩm"
          />
          <input
            type="number"
            className="w-full border p-3 rounded mb-2"
            value={product.price}
            onChange={(e) => setProduct({ ...product, price: e.target.value })}
            placeholder="Giá (VNĐ)"
          />
          
          <select
            className="w-full border p-3 rounded mb-2"
            value={product.category_id || ""}
            onChange={(e) => setProduct({ ...product, category_id: e.target.value })}
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          
          <textarea
            className="w-full border p-3 rounded mb-2 h-48 resize-none"
            value={product.description}
            onChange={(e) =>
              setProduct({ ...product, description: e.target.value })
            }
            placeholder="Mô tả sản phẩm"
          />

          {/* Chọn ảnh từ máy */}
          <input
            type="file"
            accept="image/*"
            className="w-full mb-3"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                setProduct({
                  ...product,
                  imageFile: file,
                  newImagePreview: URL.createObjectURL(file),
                });
              }
            }}
          />

          <button
            onClick={handleSave}
            className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700 transition"
          >
            💾 Lưu thay đổi
          </button>
        </div>

        {/* Ảnh cũ và ảnh mới cạnh nhau */}
        <div className="flex-1 flex gap-4">
          {product.image && (
            <div className="flex-1 text-center">
              <p className="text-sm mb-1">Ảnh cũ</p>
              <img
                src={product.image}
                alt="cũ"
                className={`rounded shadow-sm w-full h-auto object-cover ${
                  product.newImagePreview ? "opacity-50" : ""
                }`}
              />
            </div>
          )}

          {product.newImagePreview && (
            <div className="flex-1 text-center">
              <p className="text-sm mb-1">Ảnh mới</p>
              <img
                src={product.newImagePreview}
                alt="mới"
                className="rounded shadow-sm w-full h-auto object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
