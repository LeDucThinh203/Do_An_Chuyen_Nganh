import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllProductsAdmin,
  deleteProduct,
  hardDeleteProduct,
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

  const handleHideProduct = async (id) => {
    if (!window.confirm("🚫 Bạn có chắc muốn ẩn sản phẩm này khỏi trang bán hàng?")) return;
    try {
      await deleteProduct(id);
      await fetchProductData();
      alert("✅ Đã ẩn sản phẩm. Bạn có thể khôi phục trong danh sách admin.");
    } catch (err) {
      console.error("Ẩn sản phẩm thất bại:", err);
      alert(`❌ Ẩn sản phẩm thất bại: ${err.message}`);
    }
  };

  const handleDeleteProduct = async (id, hasPurchases = false) => {
    if (hasPurchases) {
      alert("Sản phẩm đã từng được mua nên không thể xóa vĩnh viễn. Vui lòng dùng nút Ẩn.");
      return;
    }

    if (!window.confirm("⚠️ Sản phẩm này chưa được mua. Bạn có chắc muốn xóa vĩnh viễn?")) return;
    try {
      await hardDeleteProduct(id);
      await fetchProductData();
      alert("✅ Đã xóa sản phẩm vĩnh viễn!");
    } catch (err) {
      console.error("Xóa sản phẩm thất bại:", err);
      alert(`❌ Xóa sản phẩm thất bại: ${err.message}`);
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

      {/* Search & Action Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 mb-5">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <svg className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm theo tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/add", { state: { returnTo: "/admin", activeTab: "product" } })}
              className="h-11 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center gap-2 whitespace-nowrap active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Thêm sản phẩm mới</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Trạng thái:</span>
          <button
            onClick={() => {
              setFilterStatus("all");
              setVisibleCount(6);
            }}
            className={`px-3.5 py-1.5 rounded-xl transition text-xs font-bold flex items-center gap-1.5 ${
              filterStatus === "all"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>Tất cả</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterStatus === "all" ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-700"}`}>
              {products.length}
            </span>
          </button>
          <button
            onClick={() => {
              setFilterStatus("active");
              setVisibleCount(6);
            }}
            className={`px-3.5 py-1.5 rounded-xl transition text-xs font-bold flex items-center gap-1.5 ${
              filterStatus === "active"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>Đang mở bán</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterStatus === "active" ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-700"}`}>
              {products.filter((p) => !p.deleted_at).length}
            </span>
          </button>
          <button
            onClick={() => {
              setFilterStatus("deleted");
              setVisibleCount(6);
            }}
            className={`px-3.5 py-1.5 rounded-xl transition text-xs font-bold flex items-center gap-1.5 ${
              filterStatus === "deleted"
                ? "bg-slate-800 text-white shadow-md shadow-slate-800/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>Đã ẩn</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterStatus === "deleted" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700"}`}>
              {products.filter((p) => Boolean(p.deleted_at)).length}
            </span>
          </button>
        </div>
      </div>

      {/* Sticky Category Filter */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md py-3.5 mb-5 rounded-2xl border border-slate-200/80 px-4 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Danh mục sản phẩm</h3>
          <span className="text-xs text-slate-500">{filteredProducts.length} kết quả</span>
        </div>
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => {
              if (filterCategory === "all") return;
              setFilterCategory("all");
              setVisibleCount(6);
            }}
            className={`px-3.5 py-1.5 rounded-xl border transition-all text-xs font-bold flex items-center gap-2 ${
              filterCategory === "all"
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-transparent text-white shadow-md shadow-blue-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <span>Tất cả</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-md ${filterCategory === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
              {categoryStats.all}
            </span>
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
              className={`px-3.5 py-1.5 rounded-xl border transition-all text-xs font-bold flex items-center gap-2 ${
                filterCategory === String(cat.id)
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <span>{cat.name}</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-md ${filterCategory === String(cat.id) ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                {categoryStats[cat.id] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="mb-6 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lọc theo mức giá</h3>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{priceRange[0].toLocaleString()} ₫</span>
            <span className="text-slate-400">—</span>
            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{priceRange[1].toLocaleString()} ₫</span>
          </div>
        </div>
        
        <div className="relative h-6 flex items-center">
          {/* Track background */}
          <div className="absolute w-full h-2 bg-slate-100 rounded-full"></div>
          
          {/* Active track */}
          <div 
            className="absolute h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
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
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-6 bg-blue-600 rounded-full inline-block"></span>
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{cat.name}</h2>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{catProducts.length}</span>
                  </div>
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
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-slate-900/80 hover:bg-slate-900 text-white w-9 h-9 rounded-full flex items-center justify-center transition shadow-lg backdrop-blur-sm hover:scale-110 active:scale-95"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-slate-900/80 hover:bg-slate-900 text-white w-9 h-9 rounded-full flex items-center justify-center transition shadow-lg backdrop-blur-sm hover:scale-110 active:scale-95"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}

                  {/* Scrollable container */}
                  <div 
                    id={`category-${cat.id}`}
                    className="overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    <div className="flex gap-5" style={{ width: 'max-content' }}>
                      {catProducts.map((product) => (
                        <div key={product.id} className="w-80 flex-shrink-0">
                          <ProductCard
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
                            handleHideProduct={handleHideProduct}
                            handleDeleteProduct={handleDeleteProduct}
                            handleRestoreProduct={handleRestoreProduct}
                            navigate={navigate}
                            calculateDiscountedPrice={calculateDiscountedPrice}
                          />
                        </div>
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
                handleHideProduct={handleHideProduct}
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
        <div className="flex justify-center mt-8 gap-3">
          {visibleCount < filteredProducts.length && (
            <button
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition shadow-md shadow-blue-500/20 active:scale-95"
            >
              Xem thêm sản phẩm
            </button>
          )}
          {visibleCount > 6 && (
            <button
              onClick={() => setVisibleCount(6)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition active:scale-95"
            >
              Thu gọn
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
  handleHideProduct,
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
    <div className={`rounded-2xl shadow-sm border overflow-hidden flex flex-col w-full transition-all duration-300 group ${
      isDeleted 
        ? 'bg-slate-50/70 border-slate-300/80 opacity-80' 
        : 'bg-white border-slate-200/90 hover:border-blue-400 hover:shadow-xl'
    }`}>
      {/* Image Container with Badges */}
      <div className="h-44 relative overflow-hidden bg-slate-100">
        <img
          src={resolveImage(product.image)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        
        {/* Status Badge */}
        {isDeleted ? (
          <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Đã ẩn</span>
          </div>
        ) : (
          <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            <span>Đang bán</span>
          </div>
        )}

        {/* Discount Badge */}
        {product.discount_percent > 0 && (
          <div className="absolute top-3 right-3 bg-rose-500 text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-md">
            -{product.discount_percent}%
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Title */}
          <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition">
            {product.name}
          </h3>
          
          {/* Price section with discount */}
          <div className="mt-2.5 flex items-baseline gap-2">
            {product.discount_percent > 0 ? (
              <>
                <span className="text-base font-black text-rose-600">
                  {calculateDiscountedPrice(product.price, product.discount_percent).toLocaleString()} ₫
                </span>
                <span className="text-xs font-semibold text-slate-400 line-through">
                  {Number(product.price).toLocaleString()} ₫
                </span>
              </>
            ) : (
              <span className="text-base font-black text-slate-900">
                {Number(product.price).toLocaleString()} ₫
              </span>
            )}
          </div>

          {/* Discount editor */}
          <div className="mt-3 flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span className="text-xs font-bold text-slate-500">Khuyến mãi:</span>
            <div className="flex items-center gap-1.5">
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
                className={`w-12 text-center bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDeleted ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
              />
              <span className="text-xs font-bold text-slate-500">%</span>
              {editingDiscount[product.id] !== undefined && (
                <button
                  onClick={() => handleUpdateDiscount(product.id, editingDiscount[product.id])}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded-lg text-xs font-bold transition shadow-sm"
                >
                  Lưu
                </button>
              )}
            </div>
          </div>

          {/* Sizes with stock */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sizes & Số lượng kho</h4>
              <span className="text-[11px] font-semibold text-slate-500">{sizesOfProduct.length} sizes</span>
            </div>

            <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-0.5">
              {sizesOfProduct.length > 0 ? (
                sizesOfProduct.map((ps) => (
                  <div
                    key={ps.id}
                    className="flex items-center justify-between bg-slate-50/80 hover:bg-slate-100/80 px-2.5 py-1.5 rounded-xl border border-slate-100 text-xs transition"
                  >
                    <span className="font-black text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs min-w-[32px] text-center">
                      {ps.size}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-medium">Kho:</span>
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
                        className={`w-14 text-center bg-white border border-slate-200 rounded-lg px-1 py-0.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDeleted ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                      />
                      {editingStock[ps.id] !== undefined && (
                        <button
                          onClick={() => handleUpdateStock(ps.id, editingStock[ps.id])}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-1.5 py-0.5 rounded-md text-[11px] font-bold transition shadow-sm"
                        >
                          Lưu
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveSize(ps.id)}
                        disabled={isDeleted}
                        className="text-slate-400 hover:text-rose-600 p-0.5 transition hover:scale-110 ml-0.5"
                        title="Xóa size"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-2 text-xs text-slate-400 italic bg-slate-50 rounded-xl">
                  Chưa có size nào
                </div>
              )}
            </div>
          </div>

          {/* Add size */}
          <div className="flex gap-1.5 mt-3">
            <select
              value={selectedSize[product.id] || ""}
              disabled={isDeleted}
              onChange={(e) =>
                setSelectedSize((prev) => ({
                  ...prev,
                  [product.id]: e.target.value,
                }))
              }
              className={`flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 transition ${isDeleted ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
            >
              <option value="">+ Chọn size thêm</option>
              {sizes.map((s) => (
                <option key={s.id} value={s.id}>
                  Size {s.size}
                </option>
              ))}
            </select>
            <button
              onClick={() => handleAddSize(product.id)}
              disabled={isDeleted}
              className={`bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl transition text-xs flex items-center gap-1 active:scale-95 shadow-sm ${isDeleted ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              Thêm
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={() => navigate(`/edit/${product.id}`, { state: { returnTo: "/admin", activeTab: "product" } })}
            disabled={isDeleted}
            className={`py-2 rounded-xl transition font-bold text-xs flex items-center justify-center gap-1 active:scale-95 ${
              isDeleted 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Sửa</span>
          </button>

          {isDeleted ? (
            <button
              onClick={() => handleRestoreProduct(product.id)}
              className="col-span-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-2 rounded-xl transition font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1 active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Khôi phục</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => handleHideProduct(product.id)}
                className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 py-2 rounded-xl transition font-bold text-xs flex items-center justify-center gap-1 active:scale-95"
              >
                <span>Ẩn</span>
              </button>
              <button
                onClick={() => handleDeleteProduct(product.id, product.hasPurchases)}
                disabled={product.hasPurchases}
                title={product.hasPurchases ? "Sản phẩm đã có đơn mua, chỉ có thể ẩn" : "Xóa vĩnh viễn"}
                className={`py-2 rounded-xl transition font-bold text-xs flex items-center justify-center gap-1 active:scale-95 ${
                  product.hasPurchases
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80'
                }`}
              >
                <span>Xóa</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
