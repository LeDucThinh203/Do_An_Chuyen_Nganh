import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllProducts,
  deleteProduct,
  updateProduct,
  getAllSizes,
  getAllProductSizes,
  createProductSize,
  updateProductSize,
  deleteProductSize,
} from "../../api.js";

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [productSizes, setProductSizes] = useState([]);
  const [selectedSize, setSelectedSize] = useState({});
  const [editingWarehouse, setEditingWarehouse] = useState({});
  const [editingDiscount, setEditingDiscount] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProductData();
  }, []);

  const fetchProductData = async () => {
    try {
      const prodData = await getAllProducts();
      const sizeData = await getAllSizes();
      const prodSizeData = await getAllProductSizes();
      setProducts(prodData);
      setSizes(sizeData);
      setProductSizes(prodSizeData);
    } catch (err) {
      console.error("Lấy dữ liệu thất bại:", err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("🗑️ Bạn có chắc muốn xóa sản phẩm này?")) return;
    try {
      await deleteProduct(id);
      setProducts(products.filter((p) => p.id !== id));
      setProductSizes(productSizes.filter((ps) => ps.product_id !== id));
    } catch (err) {
      console.error("Xóa sản phẩm thất bại:", err);
    }
  };

  const handleAddSize = async (productId) => {
    const sizeId = selectedSize[productId];
    if (!sizeId) return alert("Vui lòng chọn size");
    try {
      await createProductSize({ product_id: productId, size_id: Number(sizeId) });
      const updatedProductSizes = await getAllProductSizes();
      setProductSizes(updatedProductSizes);
      setSelectedSize((prev) => ({ ...prev, [productId]: "" }));
    } catch (err) {
      console.error("Thêm size thất bại:", err);
    }
  };

  const handleRemoveSize = async (id) => {
    try {
      await deleteProductSize(id);
      setProductSizes(productSizes.filter((ps) => ps.id !== id));
    } catch (err) {
      console.error("Xóa size thất bại:", err);
    }
  };

  const handleUpdateWarehouse = async (productSizeId, warehouse) => {
    try {
      await updateProductSize(productSizeId, { warehouse: Number(warehouse) });
      const updatedProductSizes = await getAllProductSizes();
      setProductSizes(updatedProductSizes);
      setEditingWarehouse((prev) => ({ ...prev, [productSizeId]: undefined }));
      alert("✅ Cập nhật số lượng kho thành công!");
    } catch (err) {
      console.error("Cập nhật kho thất bại:", err);
      alert("❌ Cập nhật kho thất bại!");
    }
  };

  const handleUpdateDiscount = async (productId, khuyenMai) => {
    try {
      await updateProduct(productId, { khuyen_mai: Number(khuyenMai) });
      const updatedProducts = await getAllProducts();
      setProducts(updatedProducts);
      setEditingDiscount((prev) => ({ ...prev, [productId]: undefined }));
      alert("✅ Cập nhật khuyến mãi thành công!");
    } catch (err) {
      console.error("Cập nhật khuyến mãi thất bại:", err);
      alert("❌ Cập nhật khuyến mãi thất bại!");
    }
  };

  const truncate = (text, max = 60) => {
    if (!text) return "";
    return text.length > max ? text.slice(0, max) + "..." : text;
  };

  const calculateDiscountedPrice = (price, discount) => {
    return price - (price * discount / 100);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Search + Add */}
      <div className="flex mb-4 gap-2">
        <input
          type="text"
          placeholder="🔍 Tìm sản phẩm theo tên..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={() => navigate("/add")}
          className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transition"
        >
          ➕ Thêm sản phẩm
        </button>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.slice(0, visibleCount).map((product) => {
          const sizesOfProduct = productSizes
            .filter((ps) => ps.product_id === product.id)
            .map((ps) => ({
              ...ps,
              size: sizes.find((s) => s.id === ps.size_id)?.size,
            }));

          return (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  
                  {/* Price section with discount */}
                  <div className="mt-2">
                    {product.khuyen_mai > 0 ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 line-through text-sm">
                            {Number(product.price).toLocaleString()} ₫
                          </span>
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            -{product.khuyen_mai}%
                          </span>
                        </div>
                        <p className="text-red-600 font-bold text-lg">
                          {calculateDiscountedPrice(product.price, product.khuyen_mai).toLocaleString()} ₫
                        </p>
                      </div>
                    ) : (
                      <p className="text-red-600 font-bold">
                        {Number(product.price).toLocaleString()} ₫
                      </p>
                    )}
                  </div>

                  {/* Discount editor */}
                  <div className="mt-2 flex gap-2 items-center">
                    <label className="text-sm font-medium">Khuyến mãi:</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editingDiscount[product.id] ?? product.khuyen_mai ?? 0}
                      onChange={(e) =>
                        setEditingDiscount((prev) => ({
                          ...prev,
                          [product.id]: e.target.value,
                        }))
                      }
                      className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                    <span className="text-sm">%</span>
                    {editingDiscount[product.id] !== undefined && (
                      <button
                        onClick={() => handleUpdateDiscount(product.id, editingDiscount[product.id])}
                        className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                      >
                        Lưu
                      </button>
                    )}
                  </div>

                  {/* Sizes with warehouse */}
                  <div className="mt-3">
                    <h4 className="font-medium">Sizes & Kho:</h4>
                    <div className="flex flex-col gap-2 mt-1">
                      {sizesOfProduct.length > 0
                        ? sizesOfProduct.map((ps) => (
                            <div
                              key={ps.id}
                              className="flex items-center gap-2 bg-gray-100 px-2 py-2 rounded"
                            >
                              <span className="font-medium min-w-[40px]">{ps.size}</span>
                              <div className="flex items-center gap-1 flex-1">
                                <span className="text-xs text-gray-600">Kho:</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={editingWarehouse[ps.id] ?? ps.warehouse ?? 0}
                                  onChange={(e) =>
                                    setEditingWarehouse((prev) => ({
                                      ...prev,
                                      [ps.id]: e.target.value,
                                    }))
                                  }
                                  className="w-16 border border-gray-300 rounded px-1 py-0.5 text-sm"
                                />
                                {editingWarehouse[ps.id] !== undefined && (
                                  <button
                                    onClick={() => handleUpdateWarehouse(ps.id, editingWarehouse[ps.id])}
                                    className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs hover:bg-blue-600"
                                  >
                                    Lưu
                                  </button>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoveSize(ps.id)}
                                className="text-red-500 hover:text-red-700 font-bold ml-auto"
                              >
                                ×
                              </button>
                            </div>
                          ))
                        : (
                          <span className="text-gray-500 text-sm">Chưa có size</span>
                        )}
                    </div>
                  </div>

                  {/* Add size */}
                  <div className="flex gap-2 mt-3">
                    <select
                      value={selectedSize[product.id] || ""}
                      onChange={(e) =>
                        setSelectedSize((prev) => ({
                          ...prev,
                          [product.id]: e.target.value,
                        }))
                      }
                      className="flex-1 border border-gray-300 rounded-full px-3 py-1"
                    >
                      <option value="">Chọn size</option>
                      {sizes.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.size}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAddSize(product.id)}
                      className="bg-green-500 text-white px-4 py-1 rounded-full hover:bg-green-600 transition"
                    >
                      Thêm
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => navigate(`/edit/${product.id}`)}
                    className="flex-1 bg-blue-500 text-white py-2 rounded-full hover:bg-blue-600 transition"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="flex-1 bg-red-500 text-white py-2 rounded-full hover:bg-red-600 transition"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load more / Collapse */}
      {filteredProducts.length > 6 && (
        <div className="flex justify-center mt-6 gap-4">
          {visibleCount < filteredProducts.length && (
            <button
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition"
            >
              Tải thêm
            </button>
          )}
          {visibleCount > 6 && (
            <button
              onClick={() => setVisibleCount(6)}
              className="bg-gray-500 text-white px-6 py-2 rounded-full hover:bg-gray-600 transition"
            >
              Thu gọn
            </button>
          )}
        </div>
      )}
    </div>
  );
}
