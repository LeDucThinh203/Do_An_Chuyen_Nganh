import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllProductsAdmin,
  deleteProduct,
  restoreProduct,
  updateProduct,
  getAllSizes,
  getAllProductSizes,
  createProductSize,
  updateProductSize,
  deleteProductSize,
  getAllCategories,
} from "../../api.js";
import { AdminPanelSkeleton } from "../common/Skeletons";

// Resolve image URL for products
const resolveImage = (img) => {
  if (!img) return '/images/placeholder.png';
  const trimmed = String(img).trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) {
    const parts = trimmed.split('/');
    return parts.map((part, idx) => idx === 0 ? part : encodeURIComponent(part)).join('/');
  }
  return `/images/${encodeURIComponent(trimmed)}`;
};

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [productSizes, setProductSizes] = useState([]);
  const [selectedSize, setSelectedSize] = useState({});
  const [editingStock, setEditingStock] = useState({});
  const [editingDiscount, setEditingDiscount] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProductData();
  }, []);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      const [prodData, catData, sizeData, prodSizeData] = await Promise.all([
        getAllProductsAdmin(),
        getAllCategories(),
        getAllSizes(),
        getAllProductSizes()
      ]);
      setProducts(prodData);
      setCategories(catData);
      setSizes(sizeData);
      setProductSizes(prodSizeData);
    } catch (err) {
      console.error("Lấy dữ liệu thất bại:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("🗑️ Bạn có chắc muốn ẩn sản phẩm này?")) return;
    try {
      await deleteProduct(id);
      await fetchProductData();
      alert("✅ Đã ẩn sản phẩm. Bạn có thể khôi phục trong danh sách admin.");
    } catch (err) {
      console.error("Ẩn sản phẩm thất bại:", err);
      alert(`❌ Ẩn sản phẩm thất bại: ${err.message}`);
    }
  };

  const handleRestoreProduct = async (id) => {
    if (!window.confirm("↩️ Bạn có chắc muốn khôi phục sản phẩm này?")) return;
    try {
      await restoreProduct(id);
      await fetchProductData();
      alert("✅ Khôi phục sản phẩm thành công!");
    } catch (err) {
      console.error("Khôi phục sản phẩm thất bại:", err);
      alert(`❌ Khôi phục sản phẩm thất bại: ${err.message}`);
    }
  };

  const handleAddSize = async (productId) => {
    const sizeId = selectedSize[productId];
    if (!sizeId) return alert("Vui lòng chọn size");
    const existed = productSizes.some(
      (ps) => ps.product_id === productId && Number(ps.size_id) === Number(sizeId)
    );
    if (existed) {
      alert("⚠️ Size này đã tồn tại trong sản phẩm.");
      return;
    }
    try {
      await createProductSize({ product_id: productId, size_id: Number(sizeId) });
      const updatedProductSizes = await getAllProductSizes();
      setProductSizes(updatedProductSizes);
      setSelectedSize((prev) => ({ ...prev, [productId]: "" }));
    } catch (err) {
      console.error("Thêm size thất bại:", err);
      alert(`❌ Thêm size thất bại: ${err.message}`);
    }
  };

  const handleRemoveSize = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa size này khỏi sản phẩm?")) return;
    try {
      await deleteProductSize(id);
      setProductSizes(productSizes.filter((ps) => ps.id !== id));
    } catch (err) {
      console.error("Xóa size thất bại:", err);
      alert(`❌ Xóa size thất bại: ${err.message}`);
    }
  };

  const handleUpdateStock = async (productSizeId, stock) => {
    try {
      await updateProductSize(productSizeId, { stock: Number(stock) });
      const updatedProductSizes = await getAllProductSizes();
      setProductSizes(updatedProductSizes);
      setEditingStock((prev) => ({ ...prev, [productSizeId]: undefined }));
      alert("✅ Cập nhật số lượng kho thành công!");
    } catch (err) {
      console.error("Cập nhật kho thất bại:", err);
      alert(`❌ Cập nhật kho thất bại: ${err.message}`);
    }
  };

  const handleUpdateDiscount = async (productId, discountPercent) => {
    try {
      await updateProduct(productId, { discount_percent: Number(discountPercent) });
      const updatedProducts = await getAllProductsAdmin();
      setProducts(updatedProducts);
      setEditingDiscount((prev) => ({ ...prev, [productId]: undefined }));
      alert("✅ Cập nhật khuyến mãi thành công!");
    } catch (err) {
      console.error("Cập nhật khuyến mãi thất bại:", err);
      alert("❌ Cập nhật khuyến mãi thất bại!");
    }
  };

  const calculateDiscountedPrice = (price, discount) => {
    return price - (price * discount / 100);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || p.category_id === Number(filterCategory);
    const isDeleted = Boolean(p.deleted_at);
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && !isDeleted) ||
      (filterStatus === "deleted" && isDeleted);
    
    // Tính giá sau giảm giá
    const discount = Number(p.discount_percent || 0);
    const finalPrice = discount > 0 ? p.price * (1 - discount / 100) : p.price;
    const matchesPrice = finalPrice >= priceRange[0] && finalPrice <= priceRange[1];
    
    return matchesSearch && matchesCategory && matchesPrice && matchesStatus;
  });

  const productsByStatus = useMemo(() => {
    return products.filter((p) => {
      const isDeleted = Boolean(p.deleted_at);
      if (filterStatus === "active") return !isDeleted;
      if (filterStatus === "deleted") return isDeleted;
      return true;
    });
  }, [products, filterStatus]);

  // Thống kê sản phẩm theo danh mục
  const categoryStats = useMemo(() => {
    const stats = { all: productsByStatus.length };
    categories.forEach(cat => {
      stats[cat.id] = productsByStatus.filter(p => p.category_id === cat.id).length;
    });
    return stats;
  }, [productsByStatus, categories]);

  if (loading) {
    return <AdminPanelSkeleton cardCount={6} />;
  }

  return (
    <div>
      {/* Custom slider styles */}
      <style>{`
        .slider-thumb-min::-webkit-slider-thumb,
        .slider-thumb-max::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          border: 2px solid white;
        }
        .slider-thumb-min::-moz-range-thumb,
        .slider-thumb-max::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Fixed Search + Add Button */}
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="🔍 Tìm sản phẩm theo tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={() => navigate("/add", { state: { returnTo: "/admin", activeTab: "product" } })}
            className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transition"
          >
            ➕ Thêm sản phẩm
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setFilterStatus("all");
            setVisibleCount(6);
          }}
          className={`px-4 py-2 rounded-full border transition ${
            filterStatus === "all"
              ? "bg-blue-600 text-white border-blue-700"
              : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
          }`}
        >
          Tất cả ({products.length})
        </button>
        <button
          onClick={() => {
            setFilterStatus("active");
            setVisibleCount(6);
          }}
          className={`px-4 py-2 rounded-full border transition ${
            filterStatus === "active"
              ? "bg-green-600 text-white border-green-700"
              : "bg-white text-gray-700 border-gray-300 hover:border-green-400"
          }`}
        >
          Đang bán ({products.filter((p) => !p.deleted_at).length})
        </button>
        <button
          onClick={() => {
            setFilterStatus("deleted");
            setVisibleCount(6);
          }}
          className={`px-4 py-2 rounded-full border transition ${
            filterStatus === "deleted"
              ? "bg-gray-700 text-white border-gray-800"
              : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
          }`}
        >
          Đã ẩn ({products.filter((p) => Boolean(p.deleted_at)).length})
        </button>
      </div>

      {/* Sticky Category Filter */}
      <div className="sticky top-0 z-10 bg-gray-50 py-4 mb-6 -mx-4 px-4 shadow-md">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Lọc theo danh mục:</h3>
        <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                if (filterCategory === "all") return;
                setFilterCategory("all");
                setVisibleCount(6);
              }}
              className={`px-4 py-2 rounded-lg shadow-md border-2 transition-all duration-300 transform hover:scale-105 ${
                filterCategory === "all"
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-700 shadow-blue-300 text-white font-semibold'
                  : 'bg-white border-blue-200 hover:border-blue-400 hover:shadow-blue-200 text-gray-700'
              }`}
            >
              <span className="text-lg font-bold">{categoryStats.all}</span>
              <span className="text-sm ml-2">Tất cả sản phẩm</span>
            </button>
            
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  if (filterCategory === String(cat.id)) {
                    setFilterCategory("all");
                  } else {
                    setFilterCategory(String(cat.id));
                  }
                  setVisibleCount(6);
                }}
                className={`px-4 py-2 rounded-lg shadow-md border-2 transition-all duration-300 transform hover:scale-105 ${
                  filterCategory === String(cat.id)
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 border-purple-700 shadow-purple-300 text-white font-semibold'
                    : 'bg-white border-purple-200 hover:border-purple-400 hover:shadow-purple-200 text-gray-700'
                }`}
              >
                <span className="text-lg font-bold">{categoryStats[cat.id] || 0}</span>
                <span className="text-sm ml-2">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

      {/* Price Range Filter */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Khoảng Giá</h3>
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-blue-600">{priceRange[0].toLocaleString()} VND</span>
            <span className="text-gray-500">-</span>
            <span className="text-sm font-medium text-blue-600">{priceRange[1].toLocaleString()} VND</span>
          </div>
          
          <div className="relative h-8">
            {/* Track background */}
            <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 bg-gray-200 rounded-full"></div>
            
            {/* Active track */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 h-2 bg-blue-500 rounded-full"
              style={{
                left: `${(priceRange[0] / 5000000) * 100}%`,
                right: `${100 - (priceRange[1] / 5000000) * 100}%`
              }}
            ></div>
            
            {/* Min range slider */}
            <input
              type="range"
              min="0"
              max="5000000"
              step="50000"
              value={priceRange[0]}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value < priceRange[1]) {
                  setPriceRange([value, priceRange[1]]);
                }
              }}
              className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto slider-thumb-min"
            />
            
            {/* Max range slider */}
            <input
              type="range"
              min="0"
              max="5000000"
              step="50000"
              value={priceRange[1]}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value > priceRange[0]) {
                  setPriceRange([priceRange[0], value]);
                }
              }}
              className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto slider-thumb-max"
            />
          </div>
        </div>
      </div>

      {/* Product Display by Category */}
      <div className="space-y-10">
        {/* Hiển thị tất cả sản phẩm khi không filter */}
        {filterCategory === "all" ? (
          categories.map((cat) => {
            const catProducts = filteredProducts.filter(p => p.category_id === cat.id);
            if (catProducts.length === 0) return null;
            
            return (
              <div key={cat.id} className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold uppercase">{cat.name}</h2>
                  <span className="text-sm text-gray-500">{catProducts.length} sản phẩm</span>
                </div>

                <div className="relative overflow-hidden">
                  {/* Left arrow */}
                  {catProducts.length > 3 && (
                    <button
                      onClick={() => {
                        const container = document.getElementById(`category-${cat.id}`);
                        if (!container) return;
                        container.scrollBy({ left: -400, behavior: 'smooth' });
                      }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/70 hover:bg-black text-white w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}

                  {/* Right arrow */}
                  {catProducts.length > 3 && (
                    <button
                      onClick={() => {
                        const container = document.getElementById(`category-${cat.id}`);
                        if (!container) return;
                        container.scrollBy({ left: 400, behavior: 'smooth' });
                      }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/70 hover:bg-black text-white w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}

                  {/* Scrollable container */}
                  <div 
                    id={`category-${cat.id}`}
                    className="overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    <div className="flex gap-6" style={{ width: 'max-content' }}>
                      {catProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          productSizes={productSizes}
                          sizes={sizes}
                          selectedSize={selectedSize}
                          setSelectedSize={setSelectedSize}
                          editingStock={editingStock}
                          setEditingStock={setEditingStock}
                          editingDiscount={editingDiscount}
                          setEditingDiscount={setEditingDiscount}
                          handleAddSize={handleAddSize}
                          handleRemoveSize={handleRemoveSize}
                          handleUpdateStock={handleUpdateStock}
                          handleUpdateDiscount={handleUpdateDiscount}
                          handleDeleteProduct={handleDeleteProduct}
                          handleRestoreProduct={handleRestoreProduct}
                          navigate={navigate}
                          calculateDiscountedPrice={calculateDiscountedPrice}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          /* Hiển thị grid khi filter theo danh mục cụ thể */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.slice(0, visibleCount).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                productSizes={productSizes}
                sizes={sizes}
                selectedSize={selectedSize}
                setSelectedSize={setSelectedSize}
                editingStock={editingStock}
                setEditingStock={setEditingStock}
                editingDiscount={editingDiscount}
                setEditingDiscount={setEditingDiscount}
                handleAddSize={handleAddSize}
                handleRemoveSize={handleRemoveSize}
                handleUpdateStock={handleUpdateStock}
                handleUpdateDiscount={handleUpdateDiscount}
                handleDeleteProduct={handleDeleteProduct}
                handleRestoreProduct={handleRestoreProduct}
                navigate={navigate}
                calculateDiscountedPrice={calculateDiscountedPrice}
              />
            ))}
          </div>
        )}
      </div>

      {/* Load more / Collapse - chỉ hiển thị khi filter theo danh mục */}
      {filterCategory !== "all" && filteredProducts.length > 6 && (
        <div className="flex justify-center mt-6 gap-4">
          {visibleCount < filteredProducts.length && (
            <button
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 font-medium"
            >
              ⬇ Tải thêm 6 sản phẩm
            </button>
          )}
          {visibleCount > 6 && (
            <button
              onClick={() => setVisibleCount(6)}
              className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-2 rounded-full hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 font-medium"
            >
              ⬆ Thu gọn
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ProductCard Component
function ProductCard({ 
  product, 
  productSizes, 
  sizes, 
  selectedSize, 
  setSelectedSize,
  editingStock,
  setEditingStock,
  editingDiscount,
  setEditingDiscount,
  handleAddSize,
  handleRemoveSize,
  handleUpdateStock,
  handleUpdateDiscount,
  handleDeleteProduct,
  handleRestoreProduct,
  navigate,
  calculateDiscountedPrice
}) {
  const isDeleted = Boolean(product.deleted_at);
  const sizesOfProduct = productSizes
    .filter((ps) => ps.product_id === product.id)
    .map((ps) => ({
      ...ps,
      size: sizes.find((s) => s.id === ps.size_id)?.size,
    }));

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col w-80 flex-shrink-0">
      <div className="h-48 overflow-hidden">
        <img
          src={resolveImage(product.image)}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-lg">{product.name}</h3>
          {isDeleted && (
            <span className="inline-block mt-2 text-xs font-semibold px-2 py-1 rounded-full bg-gray-800 text-white">
              Đã ẩn khỏi trang bán hàng
            </span>
          )}
          
          {/* Price section with discount */}
          <div className="mt-2">
            {product.discount_percent > 0 ? (
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 line-through text-sm">
                    {Number(product.price).toLocaleString()} ₫
                  </span>
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    -{product.discount_percent}%
                  </span>
                </div>
                <p className="text-red-600 font-bold text-lg">
                  {calculateDiscountedPrice(product.price, product.discount_percent).toLocaleString()} ₫
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
              disabled={isDeleted}
              value={editingDiscount[product.id] ?? product.discount_percent ?? 0}
              onChange={(e) =>
                setEditingDiscount((prev) => ({
                  ...prev,
                  [product.id]: e.target.value,
                }))
              }
              className={`w-16 border border-gray-300 rounded px-2 py-1 text-sm ${isDeleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            <span className="text-sm">%</span>
            {editingDiscount[product.id] !== undefined && (
              <button
                onClick={() => handleUpdateDiscount(product.id, editingDiscount[product.id])}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-2 py-1 rounded text-xs hover:from-green-600 hover:to-green-700 transition-all shadow-sm hover:shadow transform hover:scale-105 active:scale-95"
              >
                ✔ Lưu
              </button>
            )}
          </div>

          {/* Sizes with stock */}
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
                          disabled={isDeleted}
                          value={editingStock[ps.id] ?? ps.stock ?? 0}
                          onChange={(e) =>
                            setEditingStock((prev) => ({
                              ...prev,
                              [ps.id]: e.target.value,
                            }))
                          }
                          className={`w-16 border border-gray-300 rounded px-1 py-0.5 text-sm ${isDeleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        />
                        {editingStock[ps.id] !== undefined && (
                          <button
                            onClick={() => handleUpdateStock(ps.id, editingStock[ps.id])}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-0.5 rounded text-xs hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow transform hover:scale-105 active:scale-95"
                          >
                            ✔ Lưu
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveSize(ps.id)}
                        disabled={isDeleted}
                        className="text-red-500 hover:text-red-700 font-bold ml-auto text-lg transition-all hover:scale-125 active:scale-95"
                        title="Xóa size"
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
              disabled={isDeleted}
              onChange={(e) =>
                setSelectedSize((prev) => ({
                  ...prev,
                  [product.id]: e.target.value,
                }))
              }
              className={`flex-1 border border-gray-300 rounded-full px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green-400 transition ${isDeleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
              disabled={isDeleted}
              className={`bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-1 rounded-full transition-all duration-200 shadow-md ${isDeleted ? 'opacity-50 cursor-not-allowed' : 'hover:from-green-600 hover:to-green-700 hover:shadow-lg transform hover:scale-105 active:scale-95'}`}
            >
              ➕ Thêm
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => navigate(`/edit/${product.id}`, { state: { returnTo: "/admin", activeTab: "product" } })}
            disabled={isDeleted}
            className={`flex-1 text-white py-2 rounded-full transition-all duration-200 shadow-md font-medium ${isDeleted ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg transform hover:scale-105 active:scale-95'}`}
          >
            ✏️ Sửa
          </button>
          {isDeleted ? (
            <button
              onClick={() => handleRestoreProduct(product.id)}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2 rounded-full hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 font-medium"
            >
              ↩️ Khôi phục
            </button>
          ) : (
            <button
              onClick={() => handleDeleteProduct(product.id)}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-full hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 font-medium"
            >
              🗑️ Ẩn
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
