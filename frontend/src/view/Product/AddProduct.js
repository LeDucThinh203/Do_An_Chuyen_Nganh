import React, { useState, useEffect } from "react";
import { createProduct, getAllCategories } from "../../api";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
      if (data.length > 0) {
        setProduct(prev => ({ ...prev, category_id: data[0].id }));
      }
    } catch (err) {
      console.error("Lỗi tải danh mục:", err);
    }
  };

  const handleAdd = async () => {
    if (!product.name || !product.price || !product.category_id) {
      alert("⚠️ Vui lòng điền đầy đủ thông tin sản phẩm!");
      return;
    }

    let imagePath = "";
    if (product.imageFile) {
      // Lưu file vào public/images nếu backend hỗ trợ upload
      // Tạm thời giả lập đường dẫn
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
      const res = await createProduct(newProduct);
      if (res) {
        alert("✅ Thêm sản phẩm thành công!");
        navigate("/");
      } else {
        alert("❌ Lỗi khi thêm sản phẩm!");
      }
    } catch (error) {
      console.error("Lỗi thêm sản phẩm:", error);
      if (error.message.includes("403") || error.message.includes("admin")) {
        alert("❌ Bạn cần đăng nhập với tài khoản Admin để thêm sản phẩm!");
      } else if (error.message.includes("401") || error.message.includes("token")) {
        alert("❌ Phiên đăng nhập hết hạn! Vui lòng đăng nhập lại.");
      } else {
        alert("❌ Lỗi khi thêm sản phẩm: " + error.message);
      }
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-700">
        Thêm sản phẩm mới
      </h2>

      <input
        type="text"
        placeholder="Tên sản phẩm"
        className="w-full border p-2 rounded mb-3"
        value={product.name}
        onChange={(e) => setProduct({ ...product, name: e.target.value })}
      />
      <input
        type="number"
        placeholder="Giá (VNĐ)"
        className="w-full border p-2 rounded mb-3"
        value={product.price}
        onChange={(e) => setProduct({ ...product, price: e.target.value })}
      />
      
      <select
        className="w-full border p-2 rounded mb-3"
        value={product.category_id}
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
        placeholder="Mô tả sản phẩm"
        className="w-full border p-2 rounded mb-3"
        value={product.description}
        onChange={(e) =>
          setProduct({ ...product, description: e.target.value })
        }
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
              imagePreview: URL.createObjectURL(file),
            });
          }
        }}
      />

      {product.imagePreview && (
        <img
          src={product.imagePreview}
          alt="preview"
          className="rounded mb-3 shadow-sm"
        />
      )}

      <button
        onClick={handleAdd}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        ➕ Thêm sản phẩm
      </button>
    </div>
  );
}
