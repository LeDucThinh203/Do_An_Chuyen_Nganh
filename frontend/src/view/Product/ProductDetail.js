// src/view/Product/ProductDetail.js
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById, getAllSizes, createProductSize, deleteProductSize, getAllProductSizes } from "../../api";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [productSizes, setProductSizes] = useState([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProductDetail = useCallback(async () => {
    try {
      setLoading(true);
      const [productData, sizesData, productSizesData] = await Promise.all([
        getProductById(id),
        getAllSizes(),
        getAllProductSizes()
      ]);
      
      setProduct(productData);
      setSizes(sizesData);
      
      // Lọc các size có sẵn cho sản phẩm này
      const availableSizes = productSizesData.filter(ps => ps.product_id === parseInt(id));
      setProductSizes(availableSizes);
      
    } catch (err) {
      setError("Không thể tải thông tin sản phẩm");
      console.error("Lỗi:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProductDetail();
  }, [fetchProductDetail]);

  // ... phần còn lại của code giữ nguyên
  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Vui lòng chọn size!");
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = cart.find(item => 
      item.id === product.id && item.size === selectedSize
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        ...product,
        size: selectedSize,
        quantity: 1
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`🛒 Đã thêm "${product.name}" (Size: ${selectedSize}) vào giỏ hàng!`);
  };

  const handleAddSize = async () => {
    if (!selectedSize) {
      alert("Vui lòng chọn size!");
      return;
    }

    try {
      await createProductSize({
        product_id: parseInt(id),
        size_id: parseInt(selectedSize)
      });
      
      // Cập nhật lại danh sách size
      const productSizesData = await getAllProductSizes();
      const availableSizes = productSizesData.filter(ps => ps.product_id === parseInt(id));
      setProductSizes(availableSizes);
      
      alert("✅ Đã thêm size thành công!");
    } catch (err) {
      alert("❌ Thêm size thất bại!");
      console.error("Lỗi:", err);
    }
  };

  const handleRemoveSize = async (productSizeId) => {
    if (window.confirm("Bạn có chắc muốn xóa size này?")) {
      try {
        await deleteProductSize(productSizeId);
        
        // Cập nhật lại danh sách size
        const updatedSizes = productSizes.filter(ps => ps.id !== productSizeId);
        setProductSizes(updatedSizes);
        
        alert("✅ Đã xóa size thành công!");
      } catch (err) {
        alert("❌ Xóa size thất bại!");
        console.error("Lỗi:", err);
      }
    }
  };

  const isAdmin = JSON.parse(localStorage.getItem("user"))?.role === "admin";

  if (loading) return <div className="text-center py-10">Đang tải...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!product) return <div className="text-center py-10">Sản phẩm không tồn tại</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Nút quay lại */}
      <button 
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition"
      >
        ← Quay lại
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hình ảnh sản phẩm */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-96 object-cover"
          />
        </div>

        {/* Thông tin sản phẩm */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
          
          <div className="mb-6">
            <span className="text-2xl font-bold text-red-600">
              {Number(product.price).toLocaleString()} ₫
            </span>
          </div>

          {/* Chọn size */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Chọn size:</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {productSizes.map(ps => {
                const size = sizes.find(s => s.id === ps.size_id);
                return (
                  <div key={ps.id} className="relative">
                    <button
                      className={`px-4 py-2 border rounded-lg transition ${
                        selectedSize === size?.size 
                          ? "bg-black text-white border-black" 
                          : "bg-white text-gray-700 border-gray-300 hover:border-black"
                      }`}
                      onClick={() => setSelectedSize(size?.size)}
                    >
                      {size?.size}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleRemoveSize(ps.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Thêm size mới (chỉ admin) */}
            {isAdmin && (
              <div className="flex gap-2 mb-4">
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
                >
                  <option value="">Chọn size</option>
                  {sizes.map(size => (
                    <option key={size.id} value={size.id}>
                      {size.size}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddSize}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                >
                  Thêm size
                </button>
              </div>
            )}
          </div>

          {/* Nút thêm vào giỏ hàng */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition mb-4"
          >
            🛒 Thêm vào giỏ hàng
          </button>

          {/* Mô tả sản phẩm */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">Mô tả sản phẩm</h3>
            <p className="text-gray-600 leading-relaxed">
              {product.description || "Không có mô tả cho sản phẩm này."}
            </p>
          </div>
        </div>
      </div>

      {/* Thông tin chi tiết */}
      <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Thông tin chi tiết</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Nhà sản xuất:</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Đặt may công theo tiêu chuẩn áo đấu chính hãng</li>
              <li>Xuất xứ: Việt Nam</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Chất liệu:</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Vải lưới kinh cao cấp (polyester co giãn 4 chiều)</li>
              <li>Mềm mịn, thấm hút mồ hôi tốt</li>
              <li>Thoáng mát - phù hợp sử dụng hàng ngày</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}